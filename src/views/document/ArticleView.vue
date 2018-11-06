<template>
    <view-container v-if="document" :document="document" :lang="lang" :version="version" :error="promise.error">
        <div class="columns">
            <div class="column is-3">
                <content-box>
                    <field-view :document="document" :field="fields.activities" />
                    <field-view :document="document" :field="fields.categories" />
                    <field-view :document="document" :field="fields.article_type" />
                    <field-view :document="document" :field="fields.quality" />
                </content-box>

                <tool-box :document="document"/>
            </div>
            <div class="column is-9">
                <content-box>
                    <markdown-section :document="document" :field="fields.summary"/>
                    <markdown-section :document="document" :field="fields.description" hide-title/>
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
