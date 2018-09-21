<template>
    <content-box v-if="document.maps && document.maps.length!=0">
        <strong>Maps</strong>
        <div v-for="map of document.maps" :key="map.document_id">
            <document-link :document="map"/>
        </div>
    </content-box>
</template>

<script>
    import { requireDocumentProperty } from '@/js/propertiesMixins.js'

    export default {
        mixins : [ requireDocumentProperty ],
    }
</script>
