## camptocamp.org

### Contribute

On any OS, install [git](https://git-scm.com/) and [node.js](https://nodejs.org/en/). Then download camptocamp.org source code :

```
git clone https://gitlab.com/cbeauchesne/vue-camptocamp
cd vue-camptocamp

# Then, install dependencies. It's quite long, but you have to do it once.
npm install
```

And now, let's launch
```
npm run serve
```

:fireworks: on http://localhost:8080 !


### Development environment

Well, actually, it will much more comfortable to have an UI to manage every dev tasks. Simply launch
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


### Todo

* draw GPS trace on map
* change WP location on edit mode on map
* upload GPS trace
* validate_new_password : callback when requestPasswordChange
* validate_change_email
* validate_register_email
* maps
    * ask for a IGN and Bing dev key
    * recenter on...
* signup (CAPTCHA)

#### Nice to have

* Sort on data table
* add/remove columns on data table
* export as csv in data table

#### A verifier

* bien TESTER la fusion avec un autre document
* test forum.createTopic()
* test all doc's comments functions
* does saveAs dep really usefull now ?
* test requestPasswordChange and validate_new_password
* test changemail

#### Parser

Wait for decision

* markdown alerts in parser
* markdown icons in parser

#### CSS

* Preferences view is ugly
* Following view is ugly
* print CSS
* choose font family
* icon size must not be a subjet
* icon-activity bug :
  * set a border on base icon, and see that icon activity are placed 1px higher
    than font-awsome icons
  * remove font-family from icon-activity : the bug diseapper
  * issue come from this font...
* swiper take to much width : http://localhost:8080/#/waypoints/37355/fr
* site notice breaks height calc on documents view

#### Bugs
* outing > edit > refuge : ca doit etre un multi select
* on demo, style on pagination fails
* "vue/attributes-order" put v-tooltip in first, not recognized as OTHER_ATTR :
     need to update eslint-plugin-vue to 5.4, but it's a dependancies of vue-cli, so wait...

#### build

* bulma CSS is in app.css, instead of chunk-vendors.css
