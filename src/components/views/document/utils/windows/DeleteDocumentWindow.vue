<template>
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
</template>

<script>
    import c2c from '@/js/c2c'
    import constants from '@/js/constants'

    import { requireDocumentProperty } from '@/js/propertiesMixins.js'

    export default {
        mixins : [
            requireDocumentProperty
        ],

        methods:{
            show(){
                this.$refs.modalWindow.show()
            },

            executeDelete(){
                c2c.moderator.deleteDocument(this.document.document_id)
                .then(() => {
                    this.$router.push({name:constants.getDocumentType(this.document.type) + 's'})
                })
                // TODO feedback error
            }
        }
    }

</script>
