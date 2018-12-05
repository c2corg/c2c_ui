<template>
    <div id="app">
        <side-menu class="side-menu" :class="{'alternative-side-menu': alternativeSideMenu}"/>
        <navigation class="navigation" @toggleSideMenu="alternativeSideMenu=!alternativeSideMenu"/>
        <site-notice ref="siteNotice" v-if="$route.name!='home'" class="no-print site-notice"/>
        <div class="page-content">
            <router-view class="router-view"/>
        </div>
        <helper-window ref="helper"/>
        <div v-if="alternativeSideMenu" class="alternative-side-menu-shader" @click="alternativeSideMenu=false"/>
    </div>
</template>

<script>
    import Navigation from './views/Navigation'
    import SideMenu from './views/SideMenu'
    import SiteNotice from './views/SiteNotice'
    import HelperWindow from './components/helper/HelperWindow'

    export default {
        name: 'App',

        components: {
            SideMenu,
            Navigation,
            SiteNotice,
            HelperWindow
        },

        data() {
            return {
                alternativeSideMenu: false
            }
        },

        watch: {
            $route: 'hideSideMenuOnMobile'
        },

        mounted() {
            document.getElementById('splashscreen').style.display = 'none'
        },

        methods: {
            hideSideMenuOnMobile() {
                this.alternativeSideMenu = false
            }
        }
    }
</script>

<style lang="scss">

    @import '@/assets/sass/variables.scss';

    $sidemenu-width: 200px;
    $body-height : calc(100vh - #{$navbar-height});

    html{
        overflow-x: hidden;
        overflow-y: scroll;
        text-rendering: optimizeLegibility;
        text-size-adjust: 100%;
    }

    html, body, #app{
        min-height:$body-height;
    }

    #app{
    }

    .navigation{
        position:fixed;
        top:0;
        left:0;
        right:0;
        z-index:30;
    }

    .side-menu{
        padding-top:$navbar-height;
        width:$sidemenu-width;
        height:100vh;
        position:fixed;
        top:0px;
        z-index:25;
        transition: 0.3s;
    }

    .alternative-side-menu-shader{
        position:fixed;
        top:0;
        left:0;
        width: 100vw;
        height:100vh;
        background: rgba(0,0,0,0.2)
    }

    .site-notice{
        cursor:pointer;
        position:absolute;
        top:$navbar-height;
        width:100%;
        z-index:20;
        box-shadow:0 5px 10px 0px rgba(10, 10, 10, 0.50);
    }

    .page-content{
        margin-top:$navbar-height;
        display: flex;
        flex-flow: column;
    }

    @media screen and (max-width: $tablet) {

        .side-menu{
            left:-$sidemenu-width;
        }

        .alternative-side-menu{
            left:0;
        }

        .page-content{
            margin-left:0;
        }
    }

    @media screen and (min-width: $tablet) and (max-width: $desktop){

        .side-menu{
            left:-$sidemenu-width;
        }

        .alternative-side-menu{
            left:0;
        }

        .page-content{
            margin-left:0;
        }
    }

    @media screen and (min-width: $desktop) and (max-width: $widescreen){

        .page-content{
            margin-left:$sidemenu-width;
        }

        .site-notice{
            padding-left: $sidemenu-width;
        }
    }

    @media screen and (min-width: $widescreen) and (max-width: $fullhd){

        .page-content{
            margin-left:$sidemenu-width;
        }

        .site-notice{
            padding-left: $sidemenu-width;
        }
    }

    @media screen and (min-width: $fullhd){

        .page-content{
            margin-left:$sidemenu-width;
        }

        .site-notice{
            padding-left: $sidemenu-width;
        }
    }

    .router-view{
        flex-grow : 1;
    }

    @media print {
        /* print styles go here */
        .no-print {
            display: none;
        }
    }

</style>
