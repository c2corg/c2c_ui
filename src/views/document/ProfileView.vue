<template>
    <div class="section">
        <document-view-header :document="document" :version="version" :promise="promise" />

        <div v-if="document && document.not_authorized" v-translate class="notification is-danger">
            This profile is only available to authenticated users.
        </div>

        <div v-if="document && !document.not_authorized" class="columns">

            <div class="column is-3">
                <div class="box">
                    <field-view :document="document" :field="fields.activities"/>

                    <label-value :label="$gettext('forum')">
                        <a :href="$options.forumUrl + '/users/' + document.forum_username + '/activity'">
                            @{{ document.forum_username }}
                        </a>
                    </label-value>

                    <field-view :document="document" :field="fields.categories"/>

                    <div>
                        <router-link :to="{ name: 'whatsnew', query: {u:$route.params.id} }">
                            <fa-icon icon="edit" />
                            <span v-translate>Contributions</span>
                        </router-link>
                    </div>
                    <div>
                        <router-link :to="{ name: 'outings', query: {u:$route.params.id} }">
                            <icon-outing />
                            <span v-translate>Outings</span>
                        </router-link>
                    </div>

                    <div class="buttons is-centered">
                        <button
                            class="button is-primary"
                            @click="downloadOutings"
                            v-translate>
                            Download outings
                        </button>
                    </div>

                </div>

                <map-box :document="document" />
                <tool-box :document="document"/>

            </div>

            <div class="column is-9">
                <div class="box" v-if="locale.summary || locale.description">
                    <markdown-section :document="document" :field="fields.summary" @click-image="onClickImage"/>
                    <markdown-section :document="document" :field="fields.description" hide-title @click-image="onClickImage"/>
                    <div style="clear:both" />
                </div>
                <feed-widget type="profile" />
            </div>
        </div>
    </div>
</template>

<script>

    import config from '@/js/config.ts'
    import c2c from '@/js/apis/c2c'
    import utils from '@/js/utils'
    import DocumentViewMixin from './utils/DocumentViewMixin.js'

    import FeedWidget from '@/components/feed-widget/FeedWidget'

    export default {

        components: {
            FeedWidget
        },

        mixins: [ DocumentViewMixin ],

        forumUrl: config.urls.forum,

        methods: {
            downloadOutings() {
                let outings = []

                const download = function(offset) {
                    c2c.outing.getAll({ u: this.documentId, limit: 50, offset }).then(response => {
                        for (let document of response.data.documents) {
                            outings.push(document)
                        }
                        if (response.data.documents.length === 0 || outings.length === response.data.total) {
                            utils.downloadCsv(outings, 'outings.csv')
                        } else {
                            download(offset + 50)
                        }
                    })
                }.bind(this)

                download(0)
            }
        }
    }
</script>
