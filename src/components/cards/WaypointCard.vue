<template>
    <card-container :to="{name:documentType, params:{id:document.document_id}}">
        <document-title slot="header" :document="document"/>

        <div slot="row1" class="level">
            <card-region-item :document="document"/>
        </div>

        <div slot="row2" class="level">
            <card-elevation-item :elevation="document.elevation"/>

            <textual-array :array="document.slackline_types" />

            <marker-quality :quality="document.quality"/>
        </div>
    </card-container>
</template>

<script>

    import { documentCardMixin } from './utils/mixins.js'

    export default {
        mixins: [
            documentCardMixin,
        ],
    }
</script>
