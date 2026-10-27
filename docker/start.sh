#!/bin/sh
# Container entrypoint: renders the nginx configuration and the runtime configuration of the app, then runs openresty.
set -eu

envsubst '${PORT},${HEALTH_HTTP_PORT},${SERVER_NAME},${LISTEN_FLAGS}' \
  < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

/usr/local/bin/runtime-config.sh

exec /usr/bin/openresty -g 'daemon off;'
