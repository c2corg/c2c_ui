<template>
    <!-- TODO : v-if user admin -->
    <a @click="onClick" v-tooltip="tooltip">
        <fa-icon :icon="document.protected ? 'unlock' : 'lock'" />
    </a>
</template>

<script>
    import c2c from '@/js/c2c.js'

    import { requireDocumentProperty } from '@/js/propertiesMixins.js'

    export default {
        mixins : [
            requireDocumentProperty
        ],

        computed:{
            tooltip(){
                if(this.document.protected)
                    return this.$gettext('Unprotect document')
                else
                    return this.$gettext('Protect document')
            }
        },

        methods:{
            onClick(){
                if(this.document.protected){
                    c2c.unprotectDocument(this.document.document_id).then(() => {
                        this.document.protected = false
                    })
                } else {
                    c2c.protectDocument(this.document.document_id).then(() => {
                        this.document.protected = true
                    })
                }
            }
        }
    }

</script>
