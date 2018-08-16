import Vue from 'vue'
import Router from 'vue-router'

import Home from '@/components/views/Home'
import Dashboard from '@/components/views/dashboard/Dashboard'
import Serac from '@/components/views/Serac'
import FeedView from '@/components/views/feed/FeedView'
import SearchView from '@/components/views/SearchView'
import WhatsNew from '@/components/views/WhatsNew'
import LoginView from '@/components/views/LoginView'

import AccountView from '@/components/views/user/AccountView'
import FollowingView from '@/components/views/user/FollowingView'
import PreferencesView from '@/components/views/user/PreferencesView'
import MailingListsView from '@/components/views/user/MailingListsView'

import Documents from '@/components/views/Documents'
import Images from '@/components/views/Images'

import DocumentView from '@/components/views/document/DocumentView'
import DocumentHistory from '@/components/views/document/DocumentHistory'
import DocumentDiff from '@/components/views/document/DocumentDiff'

import WorkInProgress from '@/components/views/WorkInProgress'

import constants from '@/js/constants.js'

Vue.use(Router)

var routes = [
    { path: '/',             name: 'home',           component: Home },
    { path: '/dashboard',    name: 'dashboard',      component: Dashboard },
    { path: '/feed',         name: 'feed',           component: FeedView },
    { path: '/serac',        name: 'serac',          component: Serac },
    { path: '/search',       name: 'search',         component: SearchView },
    { path: '/whatsnew',     name: 'whatsnew',       component: WhatsNew },
    { path: '/auth',         name: 'auth',           component: LoginView },
    { path: '/account',      name: 'account',        component: AccountView },
    { path: '/following',    name: 'following',      component: FollowingView },
    { path: '/preferences',  name: 'preferences',    component: PreferencesView },
    { path: '/mailinglists', name: 'mailinglists',   component: MailingListsView },

    { path: '/wip', name: 'workinprogress',   component: WorkInProgress },


    // todo
    // * for each doc type :
    //   * add
    //   * edit
    // * xreport and profile data
    // * signup
    // * filters for documents
    // * maps types (ign, swiss...)
    // * see maps on document view
    // * admin actions
    // * document-view actions (hostory, edit, translate...)
    // * version-link and diff-link props are not kebab case : https://vuejs.org/v2/style-guide/#Prop-name-casing-strongly-recommended
    // * props refactoring : https://vuejs.org/v2/style-guide/#Prop-definitions-essential
    // * scope all styles : https://vuejs.org/v2/style-guide/#Component-style-scoping-essential
    // * rename single instance components : https://vuejs.org/v2/style-guide/#Single-instance-component-names-strongly-recommended
    // * do forum.createTopic()
    // * test all comments functions
    // * markdown alerts
    // * markdown icons
    // * config for url api and url forum
    // * config for history mode 

]

for(let type of Object.values(constants.documentType)){

    routes.push({
        path: '/' + type + 's',
        name: type + 's',
        component: type=='image' ? Images : Documents},
    )

    routes.push({
        path: '/' + type + 's/:id/:lang?',
        name: type,
        component: DocumentView},
    )

    routes.push({
        path: '/' + type + 's/history/:id/:lang',
        name: type + "-history",
        component: DocumentHistory},
    )

    routes.push({
        path: '/' + type + 's/diff/:id/:lang/:versionFrom/:versionTo',
        name: type + "-diff",
        component: DocumentDiff},
    )

    routes.push({
        path: '/' + type + 's/version/:id/:lang/:version',
        name: type + "-version",
        component: DocumentView},
    )
}

export default new Router({
    routes,
//  mode: 'history'
})
