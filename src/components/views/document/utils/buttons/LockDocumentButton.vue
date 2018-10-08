<template>
    <!-- TODO : v-if user admin -->
    <a
        @click="onClick"
        v-tooltip="tooltip"
        :class="document.protected ? 'lock-button-red' : 'lock-button-green'">
        <fa-icon :icon="document.protected ? 'lock' : 'unlock'" />
    </a>
</template>

<script>
    import c2c from '@/js/c2c'

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
                    c2c.moderator.unprotectDocument(this.document.document_id).then(() => {
                        this.document.protected = false
                    })
                } else {
                    c2c.moderator.protectDocument(this.document.document_id).then(() => {
                        this.document.protected = true
                    })
                }
            }
        }
    }

</script>

<style scoped lang="scss">

@import "@/assets/sass/variables.scss";

.lock-button-green{
    color:$green;
}

.lock-button-red{
    color:$red;
}

</style>
