// Require the main Sass manifest file
require('./assets/sass/main.scss');

import './js/fa.config';

/* core */
import Vue from 'vue'
import App from './App.vue'
import Router from './router'

Vue.config.productionTip = false


// add all vue component as globals components, given en require context
const addComponents = function(context){
    context.keys().forEach(key => {

        let component = context(key)
        let name = key.split("/").slice(-1)[0]

        // kebab-case-ification, assuming that all module names are in PascalCase
        name = name.replace(".vue", "").replace(/([A-Z])/g, "-$1").toLowerCase().substring(1)

        Vue.component(name, component.default)
    });
}

// add all components in /utils
addComponents(require.context('./components/utils', true, /\.vue$/))

// other globals components
Vue.component("document-card", require('./components/cards/DocumentCard').default)
Vue.component("map-view", require('./components/map/MapView').default)


// add vue-moment for generic filter :

const moment = require('moment')

require("moment/locale/ca.js")
require("moment/locale/es.js")
require("moment/locale/eu.js")
require("moment/locale/de.js")
require("moment/locale/fr.js")
require("moment/locale/it.js")
require("moment/locale/en-gb.js") // keep en in last.

Vue.use(require('vue-moment'), {moment})

// build timeAgo filter, basiccly a shorthand for  moment.utc(someDate).local().fromNow()
Vue.filter('timeAgo', (arg) => {
    return moment.utc(arg).local().fromNow()
})

new Vue({
  router:Router,
  render: h => h(App)
}).$mount('#app')


// extends javascript core objects
Array.prototype.toggle = function(value){
    if(!this.includes(value)){
        this.push(value);
        return true;
    } else {
        this.splice(this.indexOf(value), 1);
        return false;
    }
}

Array.prototype.remove = function(value){
    this.splice(this.indexOf(value), 1);
}
