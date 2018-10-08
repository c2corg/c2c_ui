<template>
    <content-box class="is-paddingless">

        <map-view
            :documents="new Array(document)"
            :show-biodiv-sports-areas="['r', 'w'].includes(document.type)"
            :biodiv-sports-activities="document.activities"
            style="height:275px"/>

        <div v-if="document.areas && document.areas.length" class="has-text-centered">

            <icon-area/>
            <span v-for="area of document.areas" :key="area.document_id" class="area-link">
                <document-link :document="area"/>
            </span>

        </div>

    </content-box>
</template>

<script>
    import { requireDocumentProperty } from "@/js/propertiesMixins.js"

    export default {
        mixins : [ requireDocumentProperty ],
    }
</script>
