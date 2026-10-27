#!/bin/sh
# Writes the runtime configuration of the app (/config.js) from the C2C_* environment variables, so that one image
# can serve any backend. Variables that are not set keep the value baked at build time.
#
#   C2C_BACKEND            name of one of the backends of the build (prod, demo...), as the starting point
#   C2C_API_URL            https://api.example.org
#   C2C_MEDIA_URL          https://media.example.org/active
#   C2C_IMAGE_BACKEND_URL  https://images.example.org
#   C2C_TRACKING_URL       https://tracking.example.org
#   C2C_MINIATURES_URL     https://media.example.org/tracking
#   C2C_FORUM_URL          https://forum.example.org
#   C2C_RECAPTCHA_KEY      public reCAPTCHA site key of the domain the app is served from
#
# The file is JavaScript, loaded before the app (index.html): values are checked, and the script stops with an error
# rather than writing something else than a plain URL / identifier. See src/js/runtime-config.ts for how it is used.
#
# C2C_HTML_DIR (default /usr/share/nginx/html) is only changed by tests.

set -eu

html_dir="${C2C_HTML_DIR:-/usr/share/nginx/html}"
out="$html_dir/config.js"
tmp="$out.tmp"
trap 'rm -f "$tmp"' EXIT

fail() {
  echo "runtime-config.sh: $*" >&2
  exit 1
}

# $1 variable name, $2 value
check_url() {
  printf '%s' "$2" | grep -Eq '^https?://[A-Za-z0-9._~:/?#@!$&()*+,;=%-]+$' ||
    fail "$1 must be an http(s) URL without quotes, spaces or backslashes (got: $2)"
}

# $1 variable name, $2 value
check_id() {
  printf '%s' "$2" | grep -Eq '^[A-Za-z0-9_-]+$' || fail "$1 may only contain letters, digits, '_' and '-' (got: $2)"
}

{
  echo '// Generated when the container starts from its C2C_* environment variables (docker/runtime-config.sh).'
  echo 'window.CAMPTOCAMP_RUNTIME_CONFIG = {'

  if [ -n "${C2C_BACKEND:-}" ]; then
    check_id C2C_BACKEND "$C2C_BACKEND"
    echo "  backend: \"$C2C_BACKEND\","
  fi

  echo '  urls: {'
  for pair in \
    api:C2C_API_URL media:C2C_MEDIA_URL imageBackend:C2C_IMAGE_BACKEND_URL tracking:C2C_TRACKING_URL \
    miniatures:C2C_MINIATURES_URL forum:C2C_FORUM_URL; do
    key="${pair%%:*}"
    var="${pair#*:}"
    eval "value=\${$var:-}"
    if [ -n "$value" ]; then
      check_url "$var" "$value"
      echo "    $key: \"$value\","
    fi
  done
  if [ -n "${C2C_RECAPTCHA_KEY:-}" ]; then
    check_id C2C_RECAPTCHA_KEY "$C2C_RECAPTCHA_KEY"
    echo "    recaptchaKey: \"$C2C_RECAPTCHA_KEY\","
  fi
  echo '  },'
  echo '};'
} > "$tmp"
mv "$tmp" "$out"

# <link rel="preconnect"> hints of index.html: they carry the build-time urls, follow the ones given here
# ($1 data-c2c-url marker, $2 value)
update_preconnect() {
  [ -n "$2" ] || return 0
  escaped=$(printf '%s' "$2" | sed -e 's/[\\&|]/\\&/g')
  sed -i -E "s|(<link rel=\"preconnect\" href=\")[^\"]*(\" data-c2c-url=\"$1\")|\\1$escaped\\2|" "$html_dir/index.html"
}
update_preconnect api "${C2C_API_URL:-}"
update_preconnect media "${C2C_MEDIA_URL:-}"
