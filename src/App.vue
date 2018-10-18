<template>
    <div id="app">
        <navigation/>
        <site-notice v-if="$route.name!='home'"/>
        <!-- <router-view :key="$route.name + JSON.stringify($route.params)"/> -->
        <router-view />
    </div>
</template>

<script>
    import Navigation from './components/views/Navigation'
    import SiteNotice from './components/views/SiteNotice'

    export default {
        name: 'App',
        components: {
            Navigation,
            SiteNotice,
        }
    }
</script>

<style lang="scss">
</style>
