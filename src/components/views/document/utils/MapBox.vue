<template>
    <content-box class="is-paddingless">

        <map-view
            :documents="new Array(document)"
            :show-biodiv-sports-areas="['r', 'w'].includes(document.type)"
            :biodiv-sports-activities="document.activities"
            style="height:275px"/>

        <div v-if="document.areas" class="has-text-centered">
            <areas-links :areas="document.areas"/>
        </div>
        
    </content-box>
</template>

<script>
    import { requireDocumentProperty } from "@/js/propertiesMixins.js"
    import AreasLinks from './AreasLinks'

    export default {
        components: {
            AreasLinks,
        },

        mixins : [ requireDocumentProperty ],
    }
</script>
