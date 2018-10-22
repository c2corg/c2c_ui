<template>
    <content-box v-if="document.associations.recent_outings.documents.length!=0" class="no-print">
        <div class="title is-2">
            <span v-translate>Last outings</span>
        </div>
        <div v-for="(outing, i) of document.associations.recent_outings.documents" :key="i">
            <!-- TODO remove duplicated -->
            <pretty-outing-link :outing="outing"/>
        </div>
    </content-box>
</template>

<script>
    import { requireDocumentProperty } from '@/js/propertiesMixins.js'

    export default {
        mixins : [ requireDocumentProperty ]
    }
</script>
