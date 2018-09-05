import constants from '@/js/constants.js'
import config from "@/js/config.js"

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

import Documents from '@/components/views//documents/Documents'
import Images from '@/components/views/documents/Images'

import DocumentView from '@/components/views/document/DocumentView'
import DocumentHistory from '@/components/views/document/DocumentHistory'
import DocumentDiff from '@/components/views/document/DocumentDiff'
import DocumentEdition from '@/components/views/edition/DocumentEdition'

import WorkInProgress from '@/components/views/WorkInProgress'
import NotFound from '@/components/views/NotFound'

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

    {
        path: '/forum',
        name: 'forum',
        beforeEnter() { location.href = config.forumUrl }
    },

    // todo
    // * add image
    // * xreport and profile data
    // * signup
    // * maps types (ign, swiss...)
    // * see maps on document view
    // * admin actions
    // * document-view actions (translate...)
    // * props refactoring : https://vuejs.org/v2/style-guide/#Prop-definitions-essential
    // * rename single instance components : https://vuejs.org/v2/style-guide/#Single-instance-component-names-strongly-recommended
    // * do forum.createTopic()
    // * test all doc's comments functions
    // * markdown alerts in parser
    // * markdown icons in parser

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
        path: '/' + type + 's/:id(\\d+)/:lang?',
        name: type,
        component: DocumentView},
    )

    routes.push({
        path: '/' + type + 's/:id(\\d+)/:lang?',
        name: def.letter,
        component: DocumentView},
    )

    routes.push({
        path: '/' + type + 's/history/:id(\\d+)/:lang',
        name: type + "-history",
        component: DocumentHistory},
    )

    routes.push({
        path: '/' + type + 's/history/:id(\\d+)/:lang',
        name: def.letter + "-history",
        component: DocumentHistory},
    )

    routes.push({
        path: '/' + type + 's/edit/:id(\\d+)/:lang',
        name: type + "-edit",
        component: DocumentEdition},
    )

    routes.push({
        path: '/' + type + 's/edit/:id(\\d+)/:lang',
        name: def.letter + "-edit",
        component: DocumentEdition},
    )

    routes.push({
        path: '/' + type + 's/add/:lang?',
        name: type + "-add",
        component: DocumentEdition},
    )

    routes.push({
        path: '/' + type + 's/add/:lang?',
        name: def.letter + "-add",
        component: DocumentEdition},
    )

    routes.push({
        path: '/' + type + 's/diff/:id(\\d+)/:lang/:versionFrom/:versionTo',
        name: type + "-diff",
        component: DocumentDiff},
    )

    routes.push({
        path: '/' + type + 's/diff/:id(\\d+)/:lang/:versionFrom/:versionTo',
        name: def.letter + "-diff",
        component: DocumentDiff},
    )

    routes.push({
        path: '/' + type + 's/version/:id(\\d+)/:lang/:version',
        name: type + "-version",
        component: DocumentView},
    )

    routes.push({
        path: '/' + type + 's/version/:id(\\d+)/:lang/:version',
        name: def.letter + "-version",
        component: DocumentView},
    )
}

routes.push({ path: '*', name: '404',   component: NotFound })

export default new Router({
    routes,
    mode: config.router_mode,
})
