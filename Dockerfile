# build stage
FROM node:lts-alpine AS build-stage
WORKDIR /
COPY package*.json ./
RUN mkdir -p public
RUN npm install
COPY . .
RUN npm run build
RUN node tools/generate-health.ts

# production stage
FROM openresty/openresty:1.31.1.1-5-bookworm AS production-stage
RUN apt-get update && apt-get install -y gettext-base # required to use envsubst
COPY --from=build-stage /dist /usr/share/nginx/html
COPY ./docker/nginx.conf /etc/nginx/conf.d/default.conf.template
COPY --chmod=755 ./docker/start.sh ./docker/runtime-config.sh /usr/local/bin/

# Default configuration
ENV PORT 80
ENV HEALTH_HTTP_PORT 8080
ENV SERVER_NAME _
# the production load balancer speaks the PROXY protocol; set LISTEN_FLAGS to an empty value to reach the container
# directly (development)
ENV LISTEN_FLAGS proxy_protocol

CMD ["/usr/local/bin/start.sh"]
