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
                    <label-value label="activities">
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

                <license-box cc="by-sa"/>

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
