# build stage
FROM node:lts-alpine as build-stage
WORKDIR /
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# production stage
FROM nginx:stable-alpine as production-stage
COPY --from=build-stage /dist /usr/share/nginx/html
COPY ./scripts/nginx.conf /etc/nginx/conf.d/default.conf.template

# This is a hack around the envsubst nginx config. Because we have `$uri` set up, it would replace this as well.
# Now we just reset it to its original value.
ENV uri \$uri
# Default configuration
ENV PORT 80
ENV SERVER_NAME _

CMD ["sh", "-c", "envsubst < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
