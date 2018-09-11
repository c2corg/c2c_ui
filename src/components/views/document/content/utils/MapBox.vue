<template>
    <content-box class="is-paddingless">
        <map-view :document="document" />
        <div v-if="document.areas" class="has-text-centered">
            <areas-links :areas="document.areas"/>
        </div>
    </content-box>
</template>

<script>
    import AreasLinks from './AreasLinks'

    export default {
        components: {
            AreasLinks,
        },

        props:["document"]
    }
</script>
