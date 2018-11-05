<template>
    <view-container>
        <template slot-scope="{ document, fields }">
            <div class="columns">
                <div class="column is-3">
                    <map-box :document="document"/>
                    <tool-box :document="document"/>
                    <license-box cc="by-sa"/>
                </div>

                <div class="column">
                    <content-box v-if="document.currentLocale_.summary || document.currentLocale_.description">
                        <markdown-section :document="document" :field="fields.summary"/>
                        <markdown-section :document="document" :field="fields.description"/>
                    </content-box>

                    <comments-box :document="document" />
                </div>
            </div>
        </template>
    </view-container>
</template>

<script>
    import DocumentViewMixin from "./utils/DocumentViewMixin.js"

    export default {
        mixins : [ DocumentViewMixin ],
    }
</script>
