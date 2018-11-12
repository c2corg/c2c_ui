<template>
    <div class="has-background-light">
        <html-header :title="$gettext('Home')"/>
        <div class="section">
            <div class="columns">
                <div class="column is-7">
                    <h3 class="title is-3">
                        <span v-translate>Activity feed</span>
                        <span v-if="$user.isLogged" class="is-size-5 is-pulled-right feed-buttons">
                            <router-link :to="{name:'preferences'}">
                                <fa-icon icon="cogs"/>
                            </router-link>
                            <fa-icon :icon="isPersonal ? 'user-check' : 'user'" @click="isPersonal=!isPersonal"/>
                        </span>
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
                isPersonal:false,
            }
        },

        watch:{
            'isPersonal':{
                handler:"load",
                immediate: true,
            }
        },

        methods:{
            load(){
                const service = (this.isPersonal ? c2c.feed.getPersonalFeed : c2c.feed.getDefaultFeed).bind(c2c.feed)

                this.feedPromise = service({pl:this.$language.current})
            }
        }
    }

</script>


<style scoped lang="scss">

    @import '@/assets/sass/variables.scss';

    .cards-container > div{
        justify-content:center;
        margin:auto;
    }

    .feed-card{
        margin-bottom: 2rem;
    }

    .feed-buttons{
        a, svg{
            color:$text;
        }

        svg{
            margin-right:0.3rem;
            cursor: pointer;
        }
    }

</style>
