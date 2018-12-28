
Actually, it will much more comfortable to have an UI to manage every dev tasks. First of all, install [Vue CLI](<https://cli.vuejs.org/>)

```bash
npm install -g @vue/cli
```

Then, simply launch :

```bash
vue ui
```

On <http://localhost:8000>, you will have on-click buttons for all features :

* `serve` : launch a ready-to-code server with hot reload
* `build` : build a ready-to-deploy production site
* `build:gitlab` : a demo site, that can be deployed on any static file server.
* `lint` : do you have followed every coding good practices ?
* `extract-messages` : if you have modified any textual string, please run this task. it will update `.pot` translation files
* `generates-docs` : Generate documentation files
* `generates-icons` : Generate icons .js files in `/src/assets/font-awesome-custom`
* `update-c2c-common` : c2c core data has been updated ? keep UI syncronised with them. We will need python 3 for this task
