<template>
    <view-container>
        <template slot-scope="{ document, fields }">

            <!-- TODO test -->
            <div v-if="document && document.not_authorized" v-translate>
                You're not authorized. Please sign-in or create an account
            </div>

            <div v-else>
                <div class="columns">

                    <div class="column is-3">
                        <content-box>
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
                        </content-box>

                        <map-box :document="document" />
                        <tool-box :document="document"/>
                        <license-box :document="document" cc="by-nc-nd"/>

                    </div>

                    <div class="column">
                        <content-box>
                            <markdown-section :document="document" :field="fields.summary"/>
                            <markdown-section :document="document" :field="fields.description" hide-title/>
                        </content-box>

                        <div v-if="feed.data">
                            <feed-card
                                v-for="(item, index) of feed.data.feed"
                                :key="index"
                                :item="item"
                                :document="item.document"/>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </view-container>
</template>

<script>
    import c2c from '@/js/c2c'

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

        created(){
            this.feed = c2c.feed.getProfileFeed({u:this.$route.params.id, pl:this.$language.current})
        }
    }
</script>
