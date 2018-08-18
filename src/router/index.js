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
import DocumentEdition from '@/components/views/edition/DocumentEdition'

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
    // * props refactoring : https://vuejs.org/v2/style-guide/#Prop-definitions-essential
    // * scope all styles : https://vuejs.org/v2/style-guide/#Component-style-scoping-essential
    // * rename single instance components : https://vuejs.org/v2/style-guide/#Single-instance-component-names-strongly-recommended
    // * do forum.createTopic()
    // * test all comments functions
    // * markdown alerts in parser
    // * markdown icons in parser
    // * config for history mode

    // * CSS
    //   * choose font size and family
    //   * icon size must not be a subjet

]

for(let type of constants.documentTypes){

    var def = constants.objectDefinitions[type]

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
        path: '/' + type + 's/:id/:lang?',
        name: def.letter,
        component: DocumentView},
    )

    routes.push({
        path: '/' + type + 's/history/:id/:lang',
        name: type + "-history",
        component: DocumentHistory},
    )

    routes.push({
        path: '/' + type + 's/history/:id/:lang',
        name: def.letter + "-history",
        component: DocumentHistory},
    )

    routes.push({
        path: '/' + type + 's/edit/:id/:lang',
        name: type + "-edit",
        component: DocumentEdition},
    )

    routes.push({
        path: '/' + type + 's/edit/:id/:lang',
        name: def.letter + "-edit",
        component: DocumentEdition},
    )

    routes.push({
        path: '/' + type + 's/diff/:id/:lang/:versionFrom/:versionTo',
        name: type + "-diff",
        component: DocumentDiff},
    )

    routes.push({
        path: '/' + type + 's/diff/:id/:lang/:versionFrom/:versionTo',
        name: def.letter + "-diff",
        component: DocumentDiff},
    )

    routes.push({
        path: '/' + type + 's/version/:id/:lang/:version',
        name: type + "-version",
        component: DocumentView},
    )

    routes.push({
        path: '/' + type + 's/version/:id/:lang/:version',
        name: def.letter + "-version",
        component: DocumentView},
    )
}

export default new Router({
    routes,
//  mode: 'history'
})
