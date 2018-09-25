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
                <map-box :document="document"/>
                <license-box cc="by-sa"/>
            </div>

            <div class="column">
                <content-box v-if="locale.summary || locale.description">
                    <markdown-section :document="document" :locale="locale" :field="fields.summary"/>
                    <markdown-section :document="document" :locale="locale" :field="fields.description"/>
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
