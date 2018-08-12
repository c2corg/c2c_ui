import Vue from 'vue'
import Router from 'vue-router'

import Home from '@/components/views/Home'
import Dashboard from '@/components/views/dashboard/Dashboard'
import Serac from '@/components/views/Serac'
import SearchView from '@/components/views/SearchView'
import WhatsNew from '@/components/views/WhatsNew'
import LoginView from '@/components/views/LoginView'

import Documents from '@/components/views/Documents'
import Images from '@/components/views/Images'

import DocumentHistory from '@/components/views/DocumentHistory'

import Route from '@/components/views/document/Route'
import Outing from '@/components/views/document/Outing'
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

    {path: '/document/history/:id/:lang',    name: 'history',            component: DocumentHistory},
    {path: '/areas/history/:id/:lang',       name: 'area-history',       component: DocumentHistory},
    {path: '/articles/history/:id/:lang',    name: 'article-history',    component: DocumentHistory},
    {path: '/books/history/:id/:lang',       name: 'book-history',       component: DocumentHistory},
    {path: '/images/history/:id/:lang',      name: 'image-history',      component: DocumentHistory},
    {path: '/outings/history/:id/:lang',     name: 'outing-history',     component: DocumentHistory},
    {path: '/profiles/history/:id/:lang',    name: 'profile-history',    component: DocumentHistory},
    {path: '/routes/history/:id/:lang',      name: 'route-history',      component: DocumentHistory},
    {path: '/waypoints/history/:id/:lang',   name: 'waypoint-history',   component: DocumentHistory},
    {path: '/xreports/history/:id/:lang',    name: 'xreport-history',    component: DocumentHistory},

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

    {path: '/areas/:id',        name: 'area',       component: Area},
    {path: '/articles/:id',     name: 'article',    component: Article},
    {path: '/books/:id',        name: 'book',       component: Book},
    {path: '/images/:id',       name: 'image',      component: Image},
    {path: '/outings/:id',      name: 'outing',     component: Outing},
    {path: '/profiles/:id',     name: 'profile',    component: WorkInProgress},
    {path: '/routes/:id',       name: 'route',      component: Route},
    {path: '/waypoints/:id',    name: 'waypoint',   component: Waypoint},
    {path: '/xreports/:id',     name: 'xreport',    component: Xreport},


    // todo
    // * for each doc type :
    //   * add
    //   * edit
    //   * view old version
    //   * diff
    // * xreport and profile data
    // * auth
    // * account
    // * preferences
    // * mailinglists
    // * following

]

export default new Router({
    routes,
//  mode: 'history'
})
