// Require the main Sass manifest file
require('./assets/sass/main.scss');

/* core */
import Vue from 'vue'
import App from './App.vue'
import Router from './router'

/* miscs */
import MapView from './components/map/MapView'

Vue.config.productionTip = false

/*
add all vue component as globals components, given en require context
*/
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
Vue.component("map-view", MapView)


// add vue-moment for generic filter :
// <span>{{ someDate | moment("dddd, MMMM Do YYYY") }}</span>
Vue.use(require('vue-moment'));

// build timeAgo filter, basiccly a shorthand for  moment.utc(someDate).local().fromNow()
const moment = require('moment')
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
