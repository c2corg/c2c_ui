<template>

    <div class="columns">

        <div  class="column is-9">
            <summary>
                <markdown :content="locale.summary"></markdown>
            </summary>
            <markdown :content="locale.description"></markdown>

        </div>

        <div class="column is-3">
            <label-value label="activities">
                <activities :activities="document.activities"/>
            </label-value>

            <field-view :document="document" :field="fields.author"/>

            <field-view :document="document" :field="fields.book_types"/>

            <field-view :document="document" label="editor" :field="fields.editor"/>
            <field-view :document="document" label="ISBN" :field="fields.isbn"/>
            <field-view :document="document" label="number of pages" :field="fields.nb_pages"/>
            <field-view :document="document" label="publication date" :field="fields.publication_date"/>

            <document-license :document="document" cc="by-sa"/>

        </div>
    </div>

</template>

<script>
    import Markdown from './utils/Markdown'
    import LabelValue from './utils/LabelValue'
    import FieldView from './utils/FieldView'

    export default {

        components: {
            Markdown,
            LabelValue,
            FieldView,
        },

        props:["document", "locale", "fields"],
    }
</script>
