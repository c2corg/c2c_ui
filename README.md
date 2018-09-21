## camptocamp.org

### Project setup
```
npm install
```

#### Compiles and hot-reloads for development
```
npm run serve
```

#### Compiles and minifies for production
```
npm run build
```

##### Lints and fixes files
```
npm run lint
```

## Todo

* Todos
  * add image
  * xreport and profile data
  * signup
  * map types
    * ask for a IGN and Bing dev key
    * recenter on...
    * test add all biodiv
    * test recenter on geolocation
  * admin actions
  * document-view actions (translate...)
  * do forum.createTopic()
  * test all doc's comments functions
  * markdown alerts in parser
  * markdown icons in parser
  * FollowingView actions
  * PreferenceView : add/remove areas
  * add feed on profile

* CSS
  * choose family
  * icon size must not be a subjet
  * icon-activity bug :
    * set a border on base icon, and see that icon activity are placed 1px higher than font-awsome icons
    * remove font-family from icon-activity : the bug diseapper
    * issue come from this font...
    * swiper take to much width : http://localhost:8080/#/waypoints/37355/fr

* optims
  * Load ol and d3 separatly

* bugs
  * on demo, style on pagination fails
  * "vue/attributes-order" put v-tooltip in first, not recognized as OTHER_ATTR : 
     need to update eslint-plugin-vue to 5.4, but it's a dependancies of vue-cli, so wait...
