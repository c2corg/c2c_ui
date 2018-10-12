<template>

    <div v-if="document && document.not_authorized" v-translate>
        You're not authorized. Please sign-in or create an account
    </div>

    <document-view-container
        v-else-if="document"
        :document="document"
        :locale="locale"

        :version="version"
        :previous-version-id="previousVersionId"
        :next-version-id="nextVersionId">

        <div>

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
                    </content-box>

                    <map-box :document="document" />

                    <license-box :document="document" cc="by-nc-nd"/>

                </div>

                <div class="column">
                    <content-box>
                        <markdown-section
                            :document="document"
                            :locale="locale"
                            :field="fields.summary"/>

                        <markdown-section
                            :document="document"
                            :locale="locale"
                            :field="fields.description"
                            hide-title/>
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
    </document-view-container>
</template>

<script>

    import c2c from '@/js/c2c'

    import mixins from "./utils/mixins.js"

    import FeedCard from '@/components/cards/FeedCard'

    export default {

        components:{
            FeedCard
        },

        mixins : [
            mixins,
        ],

        data(){
            return {
                feed:null
            }
        },

        created(){
            this.feed = c2c.feed.getProfileFeed({u:this.documentId, pl:this.$language.current})
        }
    }
</script>
