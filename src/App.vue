<template>
    <div id="app">
        <side-menu class="side-menu" />
        <div class="page-content">
            <navigation/>
            <site-notice ref="siteNotice" v-if="$route.name!='home'" class="no-print"/>
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

    $sidemenu-width: 200px;

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
