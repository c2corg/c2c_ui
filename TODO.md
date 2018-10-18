

## Todo

* pass card on slot-scope pattern
* context help : https://forum.camptocamp.org/t/draft-de-brouillon/227835/22?u=charlesb
* draw GPS trace on map
* upload GPS trace
* see geom diff in diff view
* validate_new_password : callback when requestPasswordChange
* validate_change_email
* validate_register_email
* maps
    * ask for a IGN and Bing dev key
    * recenter on...
* signup (CAPTCHA)

### Nice to have

* Sort on data table
* add/remove columns on data table
* export as csv in data table

### A verifier

* bien TESTER la fusion avec un autre document
* test forum.createTopic()
* test all doc's comments functions
* does saveAs dep really usefull now ?
* test requestPasswordChange and validate_new_password
* test changemail

### Parser

Wait for decision

* markdown alerts in parser
* markdown icons in parser

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
* swiper take to much width : http://localhost:8080/#/waypoints/37355/fr
* site notice breaks height calc on documents view

### Bugs
* outing > edit > refuge : ca doit etre un multi select
* on demo, style on pagination fails
* "vue/attributes-order" put v-tooltip in first, not recognized as OTHER_ATTR :
     need to update eslint-plugin-vue to 5.4, but it's a dependancies of vue-cli, so wait...

### Build

* bulma CSS is in app.css, instead of chunk-vendors.css
