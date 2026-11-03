#!/bin/sh
# Container entrypoint: renders the nginx configuration and the runtime configuration of the app, then runs openresty.
set -eu

# C2C_HEAD_API_URL: the API as the container reaches it, for the head tags of the document pages
# (docker/lua/c2c_head.lua), e.g. http://10.0.0.5:8080 for HAProxy's internal API frontend. Scheme, host and port only,
# with an IP or a name known to DNS (nginx's resolver doesn't read /etc/hosts, so no extra_hosts name). Unset: the
# public API URL.
C2C_HEAD_API_URL="${C2C_HEAD_API_URL:-}"
if [ -n "$C2C_HEAD_API_URL" ] && ! printf '%s' "$C2C_HEAD_API_URL" | grep -Eq '^https?://[A-Za-z0-9.-]+(:[0-9]+)?$'; then
  echo "start.sh: C2C_HEAD_API_URL must be scheme://host[:port] (got: $C2C_HEAD_API_URL)" >&2
  exit 1
fi
export C2C_HEAD_API_URL

# the variable names are given literally (hence the escaped $): envsubst must replace these ones only, nginx has its
# own $variables
envsubst "\${PORT},\${HEALTH_HTTP_PORT},\${SERVER_NAME},\${LISTEN_FLAGS},\${C2C_HEAD_API_URL}" \
  < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

/usr/local/bin/runtime-config.sh

exec /usr/bin/openresty -g 'daemon off;'
