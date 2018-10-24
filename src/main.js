// Require the main Sass manifest file
require('./assets/sass/main.scss')

import Vue from 'vue'
import App from '@/App.vue'

import router from '@/tools/router'
import documentUtils from '@/tools/documentUtils'
import fontAwesome from '@/tools/fa.config'
import getText from '@/tools/getTextPlugin'
import globalComponents from '@/tools/globalComponents'
import tooltip from '@/tools/tooltip'
import user from '@/tools/user'

import localStorage from '@/js/localStorage'

import moment from 'moment'
import vueMoment from 'vue-moment/vue-moment.js'


Vue.config.productionTip = true
Vue.config.silent = false

require("moment/locale/ca.js")
require("moment/locale/es.js")
require("moment/locale/eu.js")
require("moment/locale/de.js")
require("moment/locale/fr.js")
require("moment/locale/it.js")
require("moment/locale/en-gb.js") // keep en in last.

// add vue-moment for generic filter {{ bar | moment("yyyy") }}
Vue.use(vueMoment, {moment})

Vue.use(documentUtils)
Vue.use(fontAwesome)
Vue.use(getText)
Vue.use(globalComponents)
Vue.use(tooltip)
Vue.use(user)

// build timeAgo filter, basiccly a shorthand for  moment.utc(someDate).local().fromNow()
Vue.filter('timeAgo', (arg) => {
    return moment.utc(arg).local().fromNow()
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


Object.defineProperty(Vue.prototype, '$localStorage', {
    get() {
        if(!this.$options.name)
            throw new Error("Please set name property of your componenent")

        return localStorage.getItem(`${this.$options.name}.preferences`)
    }
})

Object.defineProperty(Vue.prototype, '$helper', {
    get() { return this.$root.$children[0].$refs.helper }
})



new Vue({
    router:router,
    render: h => h(App),
}).$mount('#app')
