<template>
    <view-container>
        <template slot-scope="{ document, fields }">

            <div class="columns">

                <div class="column is-3">
                    <content-box>
                        <label-value :label="$gettext('activities')">
                            <activities :activities="document.activities"/>
                        </label-value>

                        <field-view :document="document" :field="fields.author"/>

                        <field-view :document="document" :field="fields.book_types"/>

                        <field-view :document="document" :field="fields.editor"/>
                        <field-view :document="document" :field="fields.isbn"/>
                        <field-view :document="document" :field="fields.nb_pages"/>
                        <field-view :document="document" :field="fields.publication_date"/>
                        <field-view :document="document" :field="fields.url"/>
                    </content-box>

                    <tool-box :document="document"/>
                    <license-box cc="by-sa"/>

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
