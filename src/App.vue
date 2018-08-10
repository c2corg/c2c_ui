<template>
    <div id="app">
        <Navigation></Navigation>
        <router-view :key="$route.fullPath" />
    </div>
</template>

<script>
    import Navigation from './components/Navigation'

    export default {
        name: 'app',
        components: {
            Navigation
        }
    }
</script>
