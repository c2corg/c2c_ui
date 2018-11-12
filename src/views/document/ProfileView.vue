<template>
    <view-container v-if="document" :document="document" :lang="lang" :version="version" :error="promise.error">

        <!-- TODO test -->
        <div v-if="document && document.not_authorized" v-translate>
            You're not authorized. Please sign-in or create an account
        </div>

        <div v-else>
            <div class="columns">

                <div class="column is-3">
                    <div class="box">
                        <field-view :document="document" :field="fields.activities"/>

                        <label-value :label="$gettext('forum')">
                            @{{ document.forum_username }}
                        </label-value>

                        <field-view :document="document" :field="fields.categories"/>

                        <div>
                            <router-link :to="{ name: 'whatsnew', query: {u:$route.params.id} }" v-translate>
                                contributions
                            </router-link>
                        </div>
                        <div>
                            <router-link :to="{ name: 'outings', query: {u:$route.params.id} }" v-translate>
                                Outings
                            </router-link>
                        </div>
                    </div>

                    <map-box :document="document" />
                    <tool-box :document="document"/>

                </div>

                <div class="column is-9">
                    <div class="box">
                        <markdown-section :document="document" :field="fields.summary"/>
                        <markdown-section :document="document" :field="fields.description" hide-title/>
                    </div>

                    <div v-if="feed.data">
                        <feed-card
                            v-for="(item, index) of feed.data.feed"
                            :key="index"
                            :item="item"
                            class="feed-card"/>
                    </div>
                </div>
            </div>
        </div>
    </view-container>
</template>

<script>
    import c2c from '@/apis/c2c'

    import DocumentViewMixin from "./utils/DocumentViewMixin.js"

    import FeedCard from '@/components/cards/FeedCard'

    export default {

        components:{
            FeedCard
        },

        mixins : [ DocumentViewMixin ],

        data(){
            return {
                feed:null
            }
        },

        watch: {
            "$route":{
                handler: "load",
                immediate: true,
            }
        },

        methods: {
                load(){
                this.feed = c2c.feed.getProfileFeed({u:this.$route.params.id, pl:this.$language.current})
            }
        }
    }
</script>

<style scoped>
    .feed-card{
        margin:auto;
        margin-bottom:1.5rem;
    }
</style>
