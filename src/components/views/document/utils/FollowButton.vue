<template>
    <a
        v-if="canFollow"
        @click="onClick"
        v-tooltip="tooltip"
        :class="{'follow-button-yellow' : followed}">
        <fa-icon icon="star" />
    </a>
</template>

<script>
    import c2c from '@/apis/c2c'

    import { requireDocumentProperty } from '@/js/propertiesMixins.js'

    export default {
        mixins : [
            requireDocumentProperty
        ],

        data(){
            return {
                followed:null
            }
        },

        computed:{
            canFollow(){
                return this.document.type =='u' && this.$user.isLogged && this.$user.id != this.document.document_id
            },

            tooltip(){
                if(this.followed)
                    return this.$gettext('Stop following this contributor')
                else
                    return this.$gettext('See the activity of this contributor in your feed')
            }
        },

        created(){
            if(this.canFollow)
                c2c.userProfile.following.isFollowing(this.document.document_id)
                .then(response => this.followed = response.data.is_following)
        },

        methods:{
            onClick(){
                if(this.followed){
                    c2c.userProfile.following.remove(this.document.document_id).then(() => {
                        this.followed = false
                    })
                } else {
                    c2c.userProfile.following.add(this.document.document_id).then(() => {
                        this.followed = true
                    })
                }
            }
        }
    }

</script>

<style scoped lang="scss">

@import "@/assets/sass/variables.scss";

.follow-button-yellow{
    color:$yellow;
}

</style>
