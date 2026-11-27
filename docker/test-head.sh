#!/bin/sh
# Smoke test of the head tags of the document pages (docker/lua/c2c_head.lua) in the image, against a fake API that
# serves the cooked route fixture, reached through C2C_HEAD_API_URL (the public API URL doesn't exist).
# Then a container with an invalid C2C_HEAD_API_URL must start without it.
# Needs Docker, python3 and curl; run from the repository root:
#
#   docker build -t c2c_ui:test . && docker/test-head.sh c2c_ui:test
set -eu

image="$1"
api_port=8081
ui_port=8090
api_dir=$(mktemp -d)
container=""

cleanup() {
  [ -n "$container" ] && docker rm -f "$container" > /dev/null
  [ -n "${api_pid:-}" ] && kill "$api_pid"
  rm -rf "$api_dir"
}
trap cleanup EXIT

fail() {
  echo "test-head.sh: $*" >&2
  [ -n "$container" ] && docker logs "$container" >&2
  exit 1
}

# the fake API: /routes/57?cook=fr is the file routes/57 (http.server ignores the query), any other document is a 404
mkdir "$api_dir/routes"
cp src/js/apis/c2c/fixtures/route-cooked.json "$api_dir/routes/57"
python3 -m http.server "$api_port" --bind 127.0.0.1 --directory "$api_dir" > /dev/null 2>&1 &
api_pid=$!

container=$(docker run -d --network host -e PORT="$ui_port" -e HEALTH_HTTP_PORT=8091 -e LISTEN_FLAGS= \
  -e C2C_API_URL=https://api.invalid -e C2C_HEAD_API_URL="http://127.0.0.1:$api_port" \
  -e C2C_MEDIA_URL=https://media.example.org "$image")

for _ in $(seq 30); do
  curl -sf "http://127.0.0.1:$ui_port/health" > /dev/null && break
  sleep 1
done

page() {
  curl -sf "http://127.0.0.1:$ui_port$1" || fail "GET $1 failed"
}

html=$(page /routes/57/fr/e2e-voie)
echo "$html" | grep -q '<title>E2E sommet : E2E voie - Camptocamp.org</title>' || fail "no document title: $html"
echo "$html" | grep -q '<meta property="og:title" content="E2E sommet : E2E voie" id="meta-og-title" />' ||
  fail "no og:title: $html"
echo "$html" | grep -q '__CSP_NONCE__' && fail "CSP nonce placeholder left: $html"
# the runtime configuration inline, with the nonce of the request, instead of a request to /config.js (#4881)
echo "$html" | grep -Eq '<script nonce="[^"_]+" data-c2c-config>window\.CAMPTOCAMP_RUNTIME_CONFIG = \{.*api: "https://api\.invalid"' ||
  fail "runtime configuration not inline: $html"
echo "$html" | grep -q 'src="/config.js"' && fail "index.html still loads /config.js: $html"

# the module worker of the 3D view (MapLibre) is served as JavaScript, the other assets keep their types
content_type() {
  curl -sf -o /dev/null -w '%{content_type}' "http://127.0.0.1:$ui_port$1" || fail "GET $1 failed"
}
for asset in $(docker exec "$container" ls /usr/share/nginx/html/assets); do
  case "$asset" in
    *.mjs) expected=text/javascript ;;
    *.js) expected=application/javascript ;;
    *.css) expected=text/css ;;
    *) continue ;;
  esac
  type=$(content_type "/assets/$asset")
  [ "${type%%;*}" = "$expected" ] || fail "/assets/$asset served as $type, not $expected"
done
docker exec "$container" ls /usr/share/nginx/html/assets | grep -q '\.mjs$' || fail "no .mjs asset to check"

# from the cache this time: the fake API is gone
kill "$api_pid"
api_pid=""
page /routes/57/fr | grep -q 'id="meta-og-title"' || fail "document tags not cached"

# no API, no document, or not a document page: index.html as it is
for path in /routes/58/fr /routes /routes/edit/57/fr /; do
  html=$(page "$path")
  echo "$html" | grep -q 'id="meta-og-title"' && fail "document tags on $path: $html"
  echo "$html" | grep -q '<title>Camptocamp.org</title>' || fail "no index.html on $path: $html"
done

# invalid values: an empty address (as left by a composition variable not set), and one that would break out of the
# nginx string. The container starts anyway, warns, and serves index.html as it is (the public API URL doesn't exist).
docker rm -f "$container" > /dev/null
for bad in 'http://:8080' 'http://x"; return 200 "'; do
  container=$(docker run -d --network host -e PORT="$ui_port" -e HEALTH_HTTP_PORT=8091 -e LISTEN_FLAGS= \
    -e C2C_API_URL=https://api.invalid -e C2C_HEAD_API_URL="$bad" -e C2C_MEDIA_URL=https://media.example.org "$image")
  for _ in $(seq 30); do
    curl -sf "http://127.0.0.1:$ui_port/health" > /dev/null && break
    sleep 1
  done
  html=$(page /routes/57/fr)
  echo "$html" | grep -q '<title>Camptocamp.org</title>' || fail "C2C_HEAD_API_URL=$bad: no index.html: $html"
  echo "$html" | grep -q 'id="meta-og-title"' && fail "C2C_HEAD_API_URL=$bad: document tags: $html"
  docker logs "$container" 2>&1 | grep -q 'C2C_HEAD_API_URL ignored' || fail "C2C_HEAD_API_URL=$bad: no warning"
  docker rm -f "$container" > /dev/null
  container=""
done

echo "test-head.sh: ok"
