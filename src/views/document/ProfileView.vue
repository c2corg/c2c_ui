<template>
    <div class="section">
        <document-view-header :document="document" :version="version" :promise="promise" />
        <div v-if="document" class="columns">

            <div class="column is-3">
                <div class="box">
                    <field-view :document="document" :field="fields.activities"/>

                    <label-value :label="$gettext('forum')">
                        @{{ document.forum_username }}
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
                </div>

                <map-box :document="document" />
                <tool-box :document="document"/>

            </div>

            <div class="column is-9">
                <div class="box" v-if="locale.summary || locale.description">
                    <markdown-section :document="document" :field="fields.summary"/>
                    <markdown-section :document="document" :field="fields.description" hide-title/>
                </div>
                <feed-widget type="profile" />
            </div>
        </div>
    </div>
</template>

<script>

    import DocumentViewMixin from './utils/DocumentViewMixin.js'

    import FeedWidget from '@/components/feed-widget/FeedWidget'

    export default {

        components: {
            FeedWidget
        },

        mixins: [ DocumentViewMixin ]
    }
</script>
