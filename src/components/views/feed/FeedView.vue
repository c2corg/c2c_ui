<template>
    <div class="section content cards-container">
        <html-header title="Social network"/>
        <div v-if="feed">
            <feed-card v-for="(item, index) of feed.feed" :key="index" :item="item"/>
        </div>
    </div>
</template>

<script>

    import c2c from '@/js/c2c.js'

    import FeedCard from '@/components/cards/FeedCard'

    export default {
        components:{
            FeedCard
        },

        data(){
            return {
                feed:null
            }
        },

        created(){
            c2c.getFeed({pl:this.$language.current}).then(response=>{
                this.feed=response.data
            })
        }
    }

</script>


<style scoped>


.cards-container > div{
    justify-content:center;
    margin:auto;
}

</style>
