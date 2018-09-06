<template>
    <div class="section content">
        <div class="cards-container">
            <div v-if="following" class="is-flex">
                    <document-card v-for="document in following.following" :key="document.document_id"
                                  :document="document"/>
            </div>
        </div>
    </div>
</template>

<script>
    import c2c from '@/js/c2c.js'

    import DocumentCard from '@/components/cards/DocumentCard'

    export default {
        components:{
            DocumentCard
        },

        data(){
            return {
                following:null,
            }
        },

        created(){
            c2c.user.following.get().then(response => { this.following = response.data})
        }
    }
</script>

<style scoped>

.cards-container > div{
    flex-flow:wrap row;
    justify-content:center;
    margin:auto;
}

</style>
