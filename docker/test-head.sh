#!/bin/sh
# Smoke test of the head tags of the document pages (docker/lua/c2c_head.lua) in the image, against a fake API that
# serves the cooked route fixture. Needs Docker, python3 and curl; run from the repository root:
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
  -e C2C_API_URL="http://127.0.0.1:$api_port" -e C2C_MEDIA_URL=https://media.example.org "$image")

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

echo "test-head.sh: ok"
