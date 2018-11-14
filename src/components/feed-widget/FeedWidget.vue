<template>

    <div>
        <feed-card
            v-for="(item, index) of feed"
            :key="index"
            :item="item"
            class="feed-card"/>
        <loading-notification :promise="promise" />
    </div>

</template>

<script>
    import c2c from '@/apis/c2c'
    import FeedCard from '@/components/cards/FeedCard'

    // https://alligator.io/vuejs/implementing-infinite-scroll/

    export default {
        components:{
            FeedCard,
        },

        props:{
            type:{ // valid input : personal Default Profile
                type:String,
                required:true,
            }
        },

        data(){
            return {
                promise:null,
                feed:null,
                pagination_token:null,
                endOfFeed:false,
            }
        },

        watch:{
            "$route": "initialize",

            type:{
                handler:"initialize",
                immediate: true,
            }
        },

        mounted() {
          window.addEventListener("scroll", this.onScroll)
        },

        beforeDestroy(){
            window.removeEventListener("scroll", this.onScroll)
        },

        methods:{
            initialize(){
                this.pagination_token = undefined
                this.feed = []
                this.endOfFeed = false

                this.load()
            },

            load(){

                if(this.promise && this.promise.loading)
                    return

                if(this.endOfFeed)
                    return

                const params = {
                    pl:this.$language.current,
                    token: this.pagination_token,
                    u:this.$route.params.id,
                }

                if(this.type=="personal")
                    this.promise = c2c.feed.getPersonalFeed(params).then(this.onLoad)

                else if(this.type=="default")
                    this.promise = c2c.feed.getDefaultFeed(params).then(this.onLoad)

                else if(this.type=="profile")
                    this.promise = c2c.feed.getProfileFeed(params).then(this.onLoad)
            },

            onLoad(response){
                this.pagination_token = response.data.pagination_token

                for(let item of response.data.feed)
                    this.feed.push(item)

                this.endOfFeed = response.data.feed.length == 0
            },

            onScroll(){
                // bottomOfWindow ?
                if(document.documentElement.scrollTop + window.innerHeight === document.documentElement.offsetHeight)
                    this.load()
            },
        }
    }

</script>

<style scoped lang="scss">

    .feed-card{
        margin:auto;
        margin-bottom: 2rem;
    }

</style>
