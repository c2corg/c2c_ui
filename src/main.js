// Require the main Sass manifest file
require('./assets/sass/main.scss')

/* core */
import Vue from 'vue'
import App from '@/App.vue'
import Router from '@/router'

import GetTextPlugin from '@/translations/GetTextPlugin'
import french_translations from '@/translations/dist/fr.json'

import user from '@/js/user.js'

import FontAwesomeConfig from '@/js/fa.config'
import moment from 'moment'
import vueMoment from 'vue-moment/vue-moment.js'


Vue.config.productionTip = false
Vue.config.silent = false

Vue.use(FontAwesomeConfig)

require("moment/locale/ca.js")
require("moment/locale/es.js")
require("moment/locale/eu.js")
require("moment/locale/de.js")
require("moment/locale/fr.js")
require("moment/locale/it.js")
require("moment/locale/en-gb.js") // keep en in last.

// add vue-moment for generic filter :
Vue.use(vueMoment, {moment})

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
Vue.component("map-view", require('./components/map/OlMap').default)

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


Vue.prototype.$showHelper = function(name){
    // we have an unique helper window included in App.vue
    // this methods allows to display it anywhere
    const helperComponent = this.$root.$children[0].$refs.helper
    helperComponent.show(name)
}


new Vue({
    router:Router,
    render: h => h(App),
    // methods:{
    //     showHelper(name){
    //         console.log(this, App)
    //         this.$children[0].$refs.helper.show(name)
    //     }
    // }
}).$mount('#app')
