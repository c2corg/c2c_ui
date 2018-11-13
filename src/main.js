// Require the main Sass manifest file
require('./assets/sass/main.scss')
require('@/js/polyfills.js')

import Vue from 'vue'
import App from '@/App.vue'

import router from '@/vue-plugins/router'
import documentUtils from '@/vue-plugins/document-utils'
import fontAwesome from '@/vue-plugins/font-awesome-config'
import helperWindow from '@/vue-plugins/helper-window'
import getText from '@/vue-plugins/gettext-plugin'
import globalComponents from '@/vue-plugins/generic-components'
import localStorage from '@/vue-plugins/local-storage'
import tooltip from '@/vue-plugins/tooltip'
import user from '@/vue-plugins/user'
import vueMoment from '@/vue-plugins/vue-moment.js'

Vue.config.productionTip = false
Vue.config.silent = false

Vue.use(localStorage)       // First, vm.$localStorage property
Vue.use(vueMoment)          // moment functions
Vue.use(documentUtils)      // getDocumentType, getLocale functions
Vue.use(fontAwesome)        // <fa-icon /> component
Vue.use(getText)            // vm.$gettext() function and v-translate directive
Vue.use(helperWindow)       // vm.$helper property
Vue.use(globalComponents)   // Components available everywhere
Vue.use(tooltip)            // v-tooltip directive
Vue.use(user)               // vm.$user property

new Vue({
    router:router,
    created(){
        this.$language.setCurrent(this.$user.lang)
    },
    render: h => h(App),
}).$mount('#app')
