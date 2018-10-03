// Require the main Sass manifest file
require('./assets/sass/main.scss')

require('./js/fa.config')

/* core */
import Vue from 'vue'
import App from '@/App.vue'
import Router from '@/router'

import GetTextPlugin from '@/translations/GetTextPlugin'
import french_translations from '@/translations/dist/fr.json'

import user from '@/js/user.js'


Vue.config.productionTip = false
Vue.config.silent = false


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
// Vue.component("map-view", require('./components/map/MapView').default)
Vue.component("map-view", require('./components/map/OlMap').default)


// add vue-moment for generic filter :

// TODO : clean use of moment 
const moment = require('moment')

require("moment/locale/ca.js")
require("moment/locale/es.js")
require("moment/locale/eu.js")
require("moment/locale/de.js")
require("moment/locale/fr.js")
require("moment/locale/it.js")
require("moment/locale/en-gb.js") // keep en in last.

Vue.use(require('vue-moment'), {moment})

Vue.use(GetTextPlugin, {
    availableLanguages: {
        fr: 'Français',
        it: 'Italiano',
        de: 'Deutsch',
        en: 'English',
        es: 'Español',
        ca: 'Català',
        eu: 'Euskara',
    },
    current: user.getLang(),

    getMessages(lang){

        //eslint-disable-next-line
        console.warn(`Download ${lang}`)

        if(lang=='fr') // include fr langage in app
            return french_translations

        else if(lang=='en') //lazy load the others
            return import(/* webpackChunkName: "translations-en" */ `@/translations/dist/en.json`)

        else if(lang=='ca')
            return import(/* webpackChunkName: "translations-ca" */`@/translations/dist/ca.json`)

        else if(lang=='eu')
            return import(/* webpackChunkName: "translations-eu" */`@/translations/dist/eu.json`)

        else if(lang=='it')
            return import(/* webpackChunkName: "translations-it" */`@/translations/dist/it.json`)

        else if(lang=='de')
            return import(/* webpackChunkName: "translations-de" */`@/translations/dist/de.json`)

        else if(lang=='es')
            return import(/* webpackChunkName: "translations-es" */`@/translations/dist/es.json`)

        throw `Unsuported language : ${lang}`
    },
})

// build timeAgo filter, basiccly a shorthand for  moment.utc(someDate).local().fromNow()
Vue.filter('timeAgo', (arg) => {
    return moment.utc(arg).local().fromNow()
})

//tooltip directive
Vue.directive('tooltip',  function (el, binding) {

    if(binding.value!==null && binding.value!==undefined && binding.value!==''){
        el.classList.add("tooltip");
        el.setAttribute("data-tooltip", binding.value);

        if(binding.arg){
            el.classList.add("is-tooltip-" + binding.arg);
        }
    }
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
