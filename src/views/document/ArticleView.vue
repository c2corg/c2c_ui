<template>
    <view-container>
        <template slot-scope="{ document, fields }">
            <div class="columns">
                <div class="column is-3">
                    <content-box>
                        <activities :activities="document.activities"/>
                        <field-view :document="document" :field="fields.categories" />
                        <field-view :document="document" :field="fields.article_type" />
                        <field-view :document="document" :field="fields.quality" />
                    </content-box>

                    <associated-documents :document="document" />
                    <lang-switcher-box :document="document" />

                    <license-box :cc="document.article_type=='collab' ? 'by-sa' : 'by-nc-nd'"/>
                </div>
                <div class="column is-9">
                    <content-box>
                        <markdown-section :document="document" :field="fields.summary"/>
                        <markdown-section :document="document" :field="fields.description" hide-title/>
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
