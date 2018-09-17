<template>

    <div v-if="document && document.not_authorized">
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
                        <activities :activities="document.activities"/>

                        <label-value label="forum">
                            @{{ document.forum_username }}
                        </label-value>

                        <field-view :document="document" :field="fields.categories"/>

                        <div>
                            <router-link :to="{ name: 'whatsnew', query: {u:$route.params.id} }">
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

                </div>
            </div>
        </div>
    </document-view-container>
</template>

<script>
    import mixins from "./utils/mixins.js"

    export default {
        mixins : [
            mixins,
        ],
    }
</script>
