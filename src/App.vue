<template>
    <div id="app">
        <navigation/>
        <site-notice ref="siteNotice" v-if="$route.name!='home'"/>
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
</style>
