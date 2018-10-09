<template>
    <!-- TODO : v-if user admin -->
    <a
        @click="onClick"
        v-tooltip="tooltip"
        :class="blocked ? 'lock-button-red' : 'lock-button-green'">
        <fa-icon :icon="blocked ? 'lock' : 'unlock'" />
    </a>
</template>

<script>
    import c2c from '@/js/c2c'

    import { requireDocumentProperty } from '@/js/propertiesMixins.js'

    export default {
        mixins : [
            requireDocumentProperty
        ],

        data(){
            return {
                blocked:null
            }
        },

        computed:{
            tooltip(){
                if(this.blocked)
                    return this.$gettext('Unblock account')
                else
                    return this.$gettext('Block account')
            }
        },

        created(){
            c2c.moderator.isAccountBlocked(this.document.document_id)
            .then(response => this.blocked = response.data.blocked)
        },

        methods:{
            onClick(){
                if(this.blocked){
                    c2c.moderator.unblockAccount(this.document.document_id).then(() => {
                        this.blocked = false
                    })
                } else {
                    c2c.moderator.blockAccount(this.document.document_id).then(() => {
                        this.blocked = true
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
