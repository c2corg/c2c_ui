<template>
    <document-view-container
        v-if="document"
        :document="document"
        :locale="locale"

        :version="version"
        :previous-version-id="previousVersionId"
        :next-version-id="nextVersionId">
        <div class="columns">
            <div class="column is-3">
                <content-box>
                    <activities :activities="document.activities"/>
                </content-box>
                <license-box :cc="document.article_type=='collab' ? 'by-sa' : 'by-nc-nd'"/>
            </div>
            <div class="column is-9">
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

                <comments-box :document="document" :locale="locale" />
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
