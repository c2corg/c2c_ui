<template>
    <div class="has-background-light">
        <div class="section">
            <html-header title="Social network"/>
            <div class="columns">
                <div class="column is-7">
                    <h3 class="title is-3" v-translate>
                        Activity feed
                    </h3>
                    <div v-if="feedPromise.data">
                        <feed-card
                            v-for="(item, index) of feedPromise.data.feed"
                            :key="index"
                            :item="item"
                            class="feed-card"/>
                    </div>
                </div>
                <div class="column">
                    <h3 class="title is-3" v-translate>
                        Mobile application
                    </h3>
                    <mobile-app-advertising class="box"/>

                    <h3 class="title is-3" v-translate>
                        Last forum topics
                    </h3>

                    <forum-widget wide class="box is-paddingless"/>
                </div>
            </div>
        </div>
    </div>
</template>

<script>

    import c2c from '@/apis/c2c'

    import FeedCard from '@/components/cards/FeedCard'
    import ForumWidget from './utils/ForumWidget'
    import MobileAppAdvertising from './utils/MobileAppAdvertising'

    export default {
        components:{
            FeedCard,
            ForumWidget,
            MobileAppAdvertising,
        },

        data(){
            return {
                feedPromise:null,
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

    .feed-card{
        margin-bottom: 2rem;
    }

</style>
