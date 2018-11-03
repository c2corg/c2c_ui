<template>
    <div id="app">
        <navigation/>
        <site-notice ref="siteNotice" v-if="$route.name!='home'" class="no-print"/>
        <!-- <router-view :key="$route.name + JSON.stringify($route.params)"/> -->
        <router-view class="router-view"/>
        <helper-window ref="helper"/>
    </div>
</template>

<script>
    import Navigation from './views/Navigation'
    import SiteNotice from './views/SiteNotice'
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

html, body, #app{
    min-height:100vh;
}

#app{
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
