<template>
    <modal-confirmation
        ref="modalWindow"
        show-uncancelable-warning
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

        methods:{
            executeDelete(){
                /* TODO ask confirm */
                c2c.moderator.deleteLocale(
                    this.document.document_id,
                    this.document.currentLocale_.lang
                ).then(() => {
                    /* TODO : redirect */
                })
            }
        }
    }

</script>
