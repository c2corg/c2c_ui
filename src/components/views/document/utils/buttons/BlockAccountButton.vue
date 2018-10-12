<template>
    <a
        v-if="canBlock"
        @click="onClick"
        v-tooltip="tooltip"
        :class="{'lock-button-red':blocked}">
        <fa-icon icon="user-lock" />
    </a>
</template>

<script>
    import c2c from '@/js/c2c'
    import user from '@/js/user'

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
            canBlock(){
                return this.document.type =='u' && user.isModerator() && user.getId() != this.document.document_id
            },

            tooltip(){
                if(this.blocked)
                    return this.$gettext('Unblock account')
                else
                    return this.$gettext('Block account')
            }
        },

        created(){
            if(this.canBlock)
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

a{
    transition: 30ms;
}

.lock-button-red{
    color:$red;
}

</style>
