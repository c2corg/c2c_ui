<template>
    <div id="app">
        <side-menu class="side-menu" />
        <navigation class="navigation"/>
        <site-notice ref="siteNotice" v-if="$route.name!='home'" class="no-print site-notice"/>
        <div class="page-content">
            <router-view class="router-view"/>
        </div>
        <helper-window ref="helper"/>
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
            HelperWindow,
        },
    }
</script>

<style lang="scss">

    @import '@/assets/sass/variables.scss';

    $sidemenu-width: 200px;

    html{
        overflow-x: hidden;
        overflow-y: scroll;
        text-rendering: optimizeLegibility;
        text-size-adjust: 100%;
    }

    html, body, #app{
        min-height:100vh;
    }

    #app{
    }

    .side-menu{
        width:$sidemenu-width;
        height:100%;
        position:fixed;
        z-index:100;
    }

    .navigation{
        z-index:99;
    }

    .site-notice{
        cursor:pointer;
        position:absolute;
        top:$navbar-height;
        padding-left: $sidemenu-width;
        width:100%;
        z-index:98;
        box-shadow:0 5px 10px 0px rgba(10, 10, 10, 0.50);
    }

    .page-content{
        margin-left:$sidemenu-width;
        display: flex;
        flex-flow: column;
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
