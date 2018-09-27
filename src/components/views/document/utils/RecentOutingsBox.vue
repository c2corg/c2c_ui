<template>
    <content-box v-if="document.associations.recent_outings.documents.length!=0">
        <div class="title is-2">
            <span v-translate>Last outings</span>
        </div>
        <pretty-outing-link
            v-for="outing of document.associations.recent_outings.documents" :key="outing.document_id"
            :outing="outing"/>
    </content-box>
</template>

<script>
    import { requireDocumentProperty } from '@/js/propertiesMixins.js'

    export default {
        mixins : [ requireDocumentProperty ]
    }
</script>
