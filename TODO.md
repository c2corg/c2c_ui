

## Todo

* maps
    * ask for an Bing Map dev key
    * recenter on...
* signup (CAPTCHA)
* v-tooltip : may have break lines

### Wait for c2c issues

* https://github.com/c2corg/v6_api/issues/730
  handle if token is obsolote or corrupted
* no mail from c2c :
  * validate_new_password : callback when requestPasswordChange
  * validate_change_email
  * validate_register_email

### Wait for decision

  * markdown alerts in parser
  * markdown icons in parser

### Wait for dep issues

* "vue/attributes-order" put v-tooltip in first, not recognized as OTHER_ATTR :
     need to update eslint-plugin-vue to 5.4, but it's a dependancies of vue-cli, so wait...

### Nice to have

* Sort on data table
* add/remove columns on data table
* export as csv in data table

### A verifier

* bien TESTER la fusion avec un autre document
* test forum.createTopic()
* test all doc's comments functions

### Refactors

* rename all js file in this-is-a-file-name.js
* does saveAs filesaver dependency really usefull now ?
* test requestPasswordChange and validate_new_password
* test changemail
* remove swiper : too big...

### Optims

* flag functionnal components : https://vuejs.org/v2/guide/render-function.html#Functional-Components
* flag v-once components : https://vuejs.org/v2/api/#extends

### CSS

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

### Bugs
* on gitlab build, style on pagination fails
* on gitlab build, icon filter on map is missing, tooltip issue...

### Build

* bulma CSS is in app.css, instead of chunk-vendors.css

### Doc

* Probably https://github.com/vue-styleguidist/vue-cli-plugin-styleguidist
