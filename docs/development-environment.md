
Actually, it will much more comfortable to have an UI to manage every dev tasks. First of all, install [Vue CLI](https://cli.vuejs.org/)

```
npm install -g @vue/cli
```

Then, simply launch :
```
vue ui
```

On http://localhost:8000, you will have on-click buttons for any feature :

* `serve` : launch a ready-to-code server with hot reload
* `build` : build a ready-to-deploy production site
* `build:gitlab:demo` : a demo site, linked on [demo API](https://api.demov6.camptocamp.org/) that can be deployed on any static file server.
* `lint` : do you have followed every coding good practices ?
* `extract-messages` : if you have modified any textual string, please run this task
* `update-c2c-common` : c2c core data has been updated ? keep UI syncronised with them. We will need python 3 for this task
