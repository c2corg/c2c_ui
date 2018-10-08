<template>
    <!-- TODO : v-if user admin -->
    <span>
        <a @click="$refs.modalWindow.show()" v-tooltip="$gettext('Delete this document')">
            <fa-icon :icon="['fas','trash']" />
        </a>

        <modal-confirmation
            ref="modalWindow"
            show-uncancelable-warning
            @confirm="executeDelete">

            <span slot="title" v-translate>
                Delete this document
            </span>

            <span v-translate>
                Are you sure you want to delete this document?
            </span>

        </modal-confirmation>
    </span>
</template>

<script>
    import c2c from '@/js/c2c'

    import { requireDocumentProperty } from '@/js/propertiesMixins.js'

    export default {
        mixins : [
            requireDocumentProperty
        ],

        methods:{
            executeDelete(){
                /* TODO ask confirm */
                c2c.moderator.deleteDocument(this.document.document_id).then(() => {
                    /* TODO : redirect */
                })
            }
        }
    }

</script>
