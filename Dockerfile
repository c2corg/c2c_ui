# build stage
FROM node:lts-alpine AS build-stage
WORKDIR /
COPY package*.json ./
COPY .snyk ./
RUN mkdir -p public
RUN npm install
COPY . .
RUN npm run build
RUN node tools/generate-health.js

# production stage
FROM openresty/openresty:1.27.1.2-0-bookworm AS production-stage
RUN apt-get update && apt-get install -y gettext-base # required to use envsubst
COPY --from=build-stage /dist /usr/share/nginx/html
COPY ./docker/nginx.conf /etc/nginx/conf.d/default.conf.template

# Default configuration
ENV PORT 80
ENV HEALTH_HTTP_PORT 8080
ENV SERVER_NAME _

CMD ["sh", "-c", "envsubst '${PORT},${HEALTH_HTTP_PORT},${SERVER_NAME}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && /usr/bin/openresty -g 'daemon off;'"]
