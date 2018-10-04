<template>
    <!-- TODO : v-if user admin -->
    <a @click="onClick" v-tooltip="$gettext('Delete this document')">
        <fa-icon :icon="['fas','trash']" />
    </a>
</template>

<script>
    import c2c from '@/js/c2c'

    import { requireDocumentProperty } from '@/js/propertiesMixins.js'

    export default {
        mixins : [
            requireDocumentProperty
        ],

        methods:{
            onClick(){
                /* TODO ask confirm */
                c2c.moderator.deleteDocument(this.document.document_id).then(() => {
                    /* TODO : redirect */
                })
            }
        }
    }

</script>
