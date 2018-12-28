# Todo

* maps
  * ask for an Bing Map dev key
* signup (CAPTCHA)
* v-tooltip : may have break lines
* Markdown

## Wait for c2c issues

* <https://github.com/c2corg/v6_api/issues/730>
  handle if token is obsolote or corrupted

* no mail from c2c :
  * validate_new_password : callback when requestPasswordChange
  * validate_change_email
  * validate_register_email

## Wait for dep issues

* "vue/attributes-order" put v-tooltip in first, not recognized as OTHER_ATTR :
     need to update eslint-plugin-vue to 5.4, but it's a dependancies of vue-cli, so wait...

## Nice to have

* Sort on data table
* export as csv in data table

## A verifier

* bien TESTER la fusion avec un autre document
* test forum.createTopic()
* test all doc's comments functions
* test requestPasswordChange and validate_new_password
* test changemail

## Refactors

* does saveAs filesaver dependency really usefull now ?

## Optims

* flag functionnal components : <https://vuejs.org/v2/guide/render-function.html#Functional-Components>
* flag v-once components : <https://vuejs.org/v2/api/#extends>

## CSS

* Preferences view is ugly
* Following view is ugly
* print CSS
* choose font family

## Bugs

* on gitlab build, style on pagination fails

## Build

* bulma CSS is in app.css, instead of chunk-vendors.css

## Doc

* Probably <https://github.com/vue-styleguidist/vue-cli-plugin-styleguidist>

"@vue/typescript"
"@vue/cli-plugin-typescript": "^3.2.0",

## Obsolete stuff

* Remove gitlab-related stuff (CI...)
