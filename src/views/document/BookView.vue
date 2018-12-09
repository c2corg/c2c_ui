<template>
    <div class="section">
        <document-view-header :document="document" :version="version" :promise="promise" />
        <div v-if="document" class="columns">
            <div class="column is-3">
                <div class="box">
                    <label-value :label="$gettext('activities')">
                        <activities :activities="document.activities"/>
                    </label-value>

                    <field-view :document="document" :field="fields.author"/>

                    <field-view :document="document" :field="fields.book_types"/>

                    <field-view :document="document" :field="fields.editor"/>
                    <field-view :document="document" :field="fields.isbn"/>
                    <field-view :document="document" :field="fields.nb_pages"/>
                    <field-view :document="document" :field="fields.publication_date"/>
                    <field-view :document="document" :field="fields.url" style="overflow:hidden"/>
                </div>

                <tool-box :document="document"/>

            </div>

            <div class="column is-9">
                <div class="box">
                    <markdown-section :document="document" :field="fields.summary"/>
                    <markdown-section :document="document" :field="fields.description" hide-title/>
                </div>

                <routes-box :document="document" hide-buttons/>

                <images-box :document="document" />

                <comments-box :document="document" />
            </div>
        </div>
    </div>
</template>

<script>
    import DocumentViewMixin from './utils/DocumentViewMixin.js'

    export default {
        mixins: [ DocumentViewMixin ]
    }
</script>
