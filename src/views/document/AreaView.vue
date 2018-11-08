<template>
    <view-container v-if="document" :document="document" :lang="lang" :version="version" :error="promise.error">
        <div class="columns">
            <div class="column is-3">
                <map-box :document="document"/>
                <tool-box :document="document"/>
            </div>

            <div class="column is-9">
                <content-box v-if="document.currentLocale_.summary || document.currentLocale_.description">
                    <markdown-section :document="document" :field="fields.summary"/>
                    <markdown-section :document="document" :field="fields.description"/>
                </content-box>

                <comments-box :document="document" />
            </div>
        </div>
    </view-container>
</template>

<script>
    import DocumentViewMixin from "./utils/DocumentViewMixin.js"

    export default {
        mixins : [ DocumentViewMixin ],
    }
</script>
