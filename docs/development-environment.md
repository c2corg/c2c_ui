
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
* `build:github` : a demo site, that can be deployed on any static file server.
* `lint` : do you have followed every coding good practices ?
  * `lint:no-fix`is the same process, but it won't correct your files
* `messages:extract` : if you have modified any textual string, please run this task. it will update `.pot` translation files
* `messages:compile` : get new translation from Transifex, and compile them to `.json`files.
* `generates-docs` : Generate documentation files
* `generates-icons` : Generate icons .js files in `/src/assets/font-awesome-custom`
* `update-c2c-common` : c2c core data has been updated ? keep UI syncronised with them. We will need python 3 for this task

## Editor

I **strongly** recommend the awesome VS code, with this extensions :

* *Vetur*, **the** Vue plugin. Mandatory.
* *EditorConfig for CS code*, it will set your editor with c2c_ui conventions
* *ESLint*, what else ?
* *Debugger for chrome*, it definitly rocks! [doc](https://fr.vuejs.org/v2/cookbook/debugging-in-vscode.html) and also [here](https://github.com/Microsoft/vscode-recipes/tree/master/vuejs-cli) :rocket:
