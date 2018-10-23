<template>
    <modal-confirmation
        ref="modalWindow"
        show-uncancelable-warning
        :promise="promise"
        @confirm="executeDelete">

        <span slot="title" v-translate>
            Delete this locale
        </span>

        <span v-translate>
            Are you sure you want to delete this locale?
        </span>

    </modal-confirmation>
</template>

<script>
    import c2c from '@/js/c2c'

    import { requireDocumentProperty } from '@/js/propertiesMixins.js'

    export default {
        mixins : [ requireDocumentProperty ],

        data(){
            return {
                promise:null
            }
        },

        methods:{
            show(){
                this.$refs.modalWindow.show()
            },

            executeDelete(){
                this.promise = c2c.moderator.deleteLocale(
                    this.document.document_id,
                    this.document.currentLocale_.lang
                ).then(() => {
                    this.$router.push({name:this.documentType, id:this.document.document_id})
                })
            }
        }
    }

</script>
