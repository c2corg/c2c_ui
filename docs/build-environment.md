`Build environment` is a set of parameters that configure the UI build.

They are defined in `vue.config.js` file on root directory, and parameters are available on front side, into the `@/js/config` module.

### `local`

```
npm run serve
```

This environment is the development environment. It comes with hot-reload feature : modify a file, save it, and you'll see your modification in live!. It uses by default demo API, and it's read-write.

### `gitlab`

```
npm run build:gitlab
```

It's purpose is to be deployed on gitlab pages. Note that if you have forked the official repo, you will have this site deployed here : `https://<your_gitlab_name>.gitlab.io/vue-camptocamp/`

This environment also checks bundles sizes on build step.

### `camptocamp`

```
npm run build
```

The official build. Prod API, read-write, without API toogler.
