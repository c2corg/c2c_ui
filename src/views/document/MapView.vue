<template>
    <view-container v-if="document" :document="document" :lang="lang" :version="version" :error="promise.error">
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
                :field="fields.summary"/>

            <markdown-section
                :document="document"
                :field="fields.description"
                hide-title/>

            <comments-box :document="document" />

        </div>
    </view-container>
</template>

<script>
    import DocumentViewMixin from "./utils/DocumentViewMixin.js"

    export default {
        mixins : [ DocumentViewMixin ],
    }
</script>
