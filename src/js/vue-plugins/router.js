import constants from '@/js/constants'
import config from '@/js/config.js'

import Vue from 'vue'
import Router from 'vue-router'

// import HomeView from '@/views/staticViews/HomeView'
import TopoguideView from '@/views/static-views/TopoguideView'
import SeracView from '@/views/static-views/SeracView'
import WorkInProgressView from '@/views/static-views/WorkInProgressView'
import NotFoundView from '@/views/static-views/NotFoundView'

import DashboardView from '@/views/portals/DashboardView'
import FeedView from '@/views/portals/FeedView'

import LoginView from '@/views/user/LoginView'
import AccountView from '@/views/user/AccountView'
import FollowingView from '@/views/user/FollowingView'
import PreferencesView from '@/views/user/PreferencesView'
import MailingListsView from '@/views/user/MailingListsView'

import DocumentsView from '@/views//documents/DocumentsView'
import ImagesView from '@/views/documents/ImagesView'

import AreaView from '@/views/document/AreaView'
import ArticleView from '@/views/document/ArticleView'
import BookView from '@/views/document/BookView'
import ImageView from '@/views/document/ImageView'
import MapView from '@/views/document/MapView'
import OutingView from '@/views/document/OutingView'
import ProfileView from '@/views/document/ProfileView'
import RouteView from '@/views/document/RouteView'
import WaypointView from '@/views/document/WaypointView'
import XreportView from '@/views/document/XreportView'

// lazy-load components
// actually, only diff is quite big, because of diff computation
// but lets group together this three views.
const AreaEditionView = () => import(/* webpackChunkName: "wiki-tools" */ '@/views/wiki/edition/AreaEditionView')
const ArticleEditionView = () => import(/* webpackChunkName: "wiki-tools" */ '@/views/wiki/edition/ArticleEditionView')
const BookEditionView = () => import(/* webpackChunkName: "wiki-tools" */ '@/views/wiki/edition/BookEditionView')
const ImageEditionView = () => import(/* webpackChunkName: "wiki-tools" */ '@/views/wiki/edition/ImageEditionView')
const MapEditionView = () => import(/* webpackChunkName: "wiki-tools" */ '@/views/wiki/edition/MapEditionView')
const OutingEditionView = () => import(/* webpackChunkName: "wiki-tools" */ '@/views/wiki/edition/OutingEditionView')
const ProfileEditionView = () => import(/* webpackChunkName: "wiki-tools" */ '@/views/wiki/edition/ProfileEditionView')
const RouteEditionView = () => import(/* webpackChunkName: "wiki-tools" */ '@/views/wiki/edition/RouteEditionView')
const WaypointEditionView = () => import(/* webpackChunkName: "wiki-tools" */ '@/views/wiki/edition/WaypointEditionView')
const XreportEditionView = () => import(/* webpackChunkName: "wiki-tools" */ '@/views/wiki/edition/XreportEditionView')
const WhatsNewView = () => import(/* webpackChunkName: "wiki-tools" */ `@/views/wiki/WhatsNewView.vue`)
const HistoryView = () => import(/* webpackChunkName: "wiki-tools" */ `@/views/wiki/HistoryView.vue`)
const DiffView = () => import(/* webpackChunkName: "wiki-tools" */ `@/views/wiki/DiffView.vue`)

var routes = [
    { path: '/', name: 'home', component: FeedView },
    { path: '/dashboard', name: 'dashboard', component: DashboardView },
    { path: '/topoguide', name: 'topoguide', component: TopoguideView },
    { path: '/feed', name: 'feed', component: FeedView },
    { path: '/serac', name: 'serac', component: SeracView },
    { path: '/whatsnew', name: 'whatsnew', component: WhatsNewView },
    { path: '/auth', name: 'auth', component: LoginView },
    { path: '/account', name: 'account', component: AccountView },
    { path: '/following', name: 'following', component: FollowingView },
    { path: '/preferences', name: 'preferences', component: PreferencesView },
    { path: '/mailinglists', name: 'mailinglists', component: MailingListsView },

    { path: '/wip', name: 'workinprogress', component: WorkInProgressView },

    {
        path: '/forum',
        name: 'forum',
        beforeEnter() {
            location.href = config.urls.forum
        }
    }
]

const addDocumentTypeView = function(def, viewComponent, editionComponent) {
    routes.push({
        path: '/' + def.documentType + 's',
        name: def.documentType + 's',
        component: def.documentType == 'image' ? ImagesView : DocumentsView }
    )

    routes.push({
        path: '/' + def.documentType + 's/:id(\\d+)/:lang?/:title?',
        name: def.documentType,
        component: viewComponent }
    )

    routes.push({
        path: '/' + def.documentType + 's/version/:id(\\d+)/:lang/:version',
        name: def.documentType + '-version',
        component: viewComponent }
    )

    routes.push({
        path: '/' + def.documentType + 's/history/:id(\\d+)/:lang',
        name: def.documentType + '-history',
        component: HistoryView }
    )

    routes.push({
        path: '/' + def.documentType + 's/edit/:id(\\d+)/:lang',
        name: def.documentType + '-edit',
        component: editionComponent }
    )

    routes.push({
        path: '/' + def.documentType + 's/add/:lang?',
        name: def.documentType + '-add',
        component: editionComponent }
    )

    routes.push({
        path: '/' + def.documentType + 's/diff/:id(\\d+)/:lang/:versionFrom/:versionTo',
        name: def.documentType + '-diff',
        component: DiffView }
    )
}

addDocumentTypeView(constants.objectDefinitions.area, AreaView, AreaEditionView)
addDocumentTypeView(constants.objectDefinitions.article, ArticleView, ArticleEditionView)
addDocumentTypeView(constants.objectDefinitions.book, BookView, BookEditionView)
addDocumentTypeView(constants.objectDefinitions.image, ImageView, ImageEditionView)
addDocumentTypeView(constants.objectDefinitions.map, MapView, MapEditionView)
addDocumentTypeView(constants.objectDefinitions.outing, OutingView, OutingEditionView)
addDocumentTypeView(constants.objectDefinitions.profile, ProfileView, ProfileEditionView)
addDocumentTypeView(constants.objectDefinitions.route, RouteView, RouteEditionView)
addDocumentTypeView(constants.objectDefinitions.waypoint, WaypointView, WaypointEditionView)
addDocumentTypeView(constants.objectDefinitions.xreport, XreportView, XreportEditionView)

routes.push({ path: '*', name: '404', component: NotFoundView })

Vue.use(Router)

export default new Router({
    routes,
    mode: config.routerMode
})
