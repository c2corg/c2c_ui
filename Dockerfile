# build stage
FROM node:lts-alpine as build-stage
WORKDIR /
COPY package*.json ./
COPY .snyk /
RUN npm install
COPY . .
RUN npm run build
RUN node tools/generate-health.js

# production stage
FROM openresty/openresty:buster as production-stage
COPY --from=build-stage /dist /usr/share/nginx/html
COPY ./docker/nginx.conf /etc/nginx/conf.d/default.conf.template

# Default configuration
ENV PORT 80
ENV SERVER_NAME _

CMD ["sh", "-c", "envsubst '${PORT},${SERVER_NAME}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && /usr/bin/openresty -g 'daemon off;'"]
