import Vue from 'vue'
import Router from 'vue-router'

import Home from '@/components/views/Home'
import Dashboard from '@/components/views/dashboard/Dashboard'
import Serac from '@/components/views/Serac'
import SearchView from '@/components/views/SearchView'
import WhatsNew from '@/components/views/WhatsNew'
import LoginView from '@/components/views/LoginView'
import AccountView from '@/components/views/AccountView'

import Documents from '@/components/views/Documents'
import Images from '@/components/views/Images'

import DocumentHistory from '@/components/views/DocumentHistory'
import DocumentDiff from '@/components/views/DocumentDiff'

import Route from '@/components/views/document/Route'
import Outing from '@/components/views/document/Outing'
import Profile from '@/components/views/document/Profile'
import Article from '@/components/views/document/Article'
import Book from '@/components/views/document/Book'
import Area from '@/components/views/document/Area'
import Image from '@/components/views/document/Image'
import Waypoint from '@/components/views/document/Waypoint'
import Xreport from '@/components/views/document/Xreport'

import WorkInProgress from '@/components/views/WorkInProgress'




Vue.use(Router)

const routes = [
    {path: '/',             name: 'home',       component: Home },
    {path: '/dashboard',    name: 'dashboard',  component: Dashboard },
    {path: '/serac',        name: 'serac',      component: Serac },
    {path: '/feed',         name: 'feed',       component: WorkInProgress },
    {path: '/search',       name: 'search',     component: SearchView },
    {path: '/whatsnew',     name: 'whatsnew',   component: WhatsNew },
    {path: '/auth',         name: 'auth',       component: LoginView },
    {path: '/account',      name: 'account',    component: AccountView },

    {path: '/:type/history/:id/:lang',                      name: 'history',    component: DocumentHistory},
    {path: '/:type/diff/:id/:lang/:versionFrom/:versionTo', name: 'diff',       component: DocumentDiff},

    {path: '/areas',        name: 'areas',      component: Documents},
    {path: '/articles',     name: 'articles',   component: Documents},
    {path: '/books',        name: 'books',      component: Documents},
    {path: '/images',       name: 'images',     component: Images},
    {path: '/maps',         name: 'maps',       component: Documents},
    {path: '/outings',      name: 'outings',    component: Documents},
    {path: '/profiles',     name: 'profiles',   component: Documents},
    {path: '/routes',       name: 'routes',     component: Documents},
    {path: '/waypoints',    name: 'waypoints',  component: Documents},
    {path: '/xreports',     name: 'xreports',   component: Documents},

    {path: '/areas/:id/:lang?',        name: 'area',       component: Area},
    {path: '/articles/:id/:lang?',     name: 'article',    component: Article},
    {path: '/books/:id/:lang?',        name: 'book',       component: Book},
    {path: '/images/:id/:lang?',       name: 'image',      component: Image},
    {path: '/outings/:id/:lang?',      name: 'outing',     component: Outing},
    {path: '/profiles/:id/:lang?',     name: 'profile',    component: Profile},
    {path: '/routes/:id/:lang?',       name: 'route',      component: Route},
    {path: '/waypoints/:id/:lang?',    name: 'waypoint',   component: Waypoint},
    {path: '/xreports/:id/:lang?',     name: 'xreport',    component: Xreport},


    // todo
    // * for each doc type :
    //   * add
    //   * edit
    //   * view old version
    // * xreport and profile data
    // * signup
    // * preferences
    // * mailinglists
    // * following

]

export default new Router({
    routes,
//  mode: 'history'
})
