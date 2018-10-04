<template>
    <div class="section content cards-container">
        <html-header title="Social network"/>
        <div v-if="feedPromise.data">
            <feed-card
                v-for="(item, index) of feedPromise.data.feed"
                :key="index"
                :item="item"
                :document="item.document"/>
        </div>
    </div>
</template>

<script>

    import c2c from '@/js/c2c'

    import FeedCard from '@/components/cards/FeedCard'

    export default {
        components:{
            FeedCard
        },

        data(){
            return {
                feedPromise:null
            }
        },

        created(){
            this.feedPromise = c2c.feed.getDefaultFeed({pl:this.$language.current})
        }
    }

</script>


<style scoped>


.cards-container > div{
    justify-content:center;
    margin:auto;
}

</style>
