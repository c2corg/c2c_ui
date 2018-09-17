<template>
    <document-view-container
        v-if="document"
        :document="document"
        :locale="locale"

        :version="version"
        :previous-version-id="previousVersionId"
        :next-version-id="nextVersionId">
        <div>
            <div class="columns">
                <div class="column is-3">
                    <label>editor</label>
                    <span>{{ document.editor }}</span>
                </div>
                <div class="column is-3">
                    <label>code</label>
                    <span>{{ document.code }}</span>
                </div>
                <div class="column is-3">
                    <label>Scale</label>
                    <span>{{ document.scale }}</span>
                </div>
            </div>

            <markdown-section
                :document="document"
                :locale="locale"
                :field="fields.summary"/>

            <markdown-section
                :document="document"
                :locale="locale"
                :field="fields.description"
                hide-title/>

            <comments-box :document="document" :locale="locale" />

            <license-box cc="by-sa"/>

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
