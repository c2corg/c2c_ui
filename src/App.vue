<template>
    <div id="app">
        <navigation/>
        <site-notice ref="siteNotice" v-if="$route.name!='home'" class="no-print"/>
        <!-- <router-view :key="$route.name + JSON.stringify($route.params)"/> -->
        <router-view />
        <helper-window ref="helper"/>
    </div>
</template>

<script>
    import Navigation from './components/views/Navigation'
    import SiteNotice from './components/views/SiteNotice'
    import HelperWindow from './components/helper/HelperWindow'

    export default {
        name: 'App',

        components: {
            Navigation,
            SiteNotice,
            HelperWindow,
        },
    }
</script>

<style lang="scss">
body{
    overflow-y: hidden;
    min-height:100vh;
}
body::-webkit-scrollbar {
    display: none;
}

@media print {
    /* print styles go here */
    .no-print {
        display: none;
    }
}

</style>
