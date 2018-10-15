<template>
    <edition-container
        v-if="document"
        :document="document"
        :locale="locale">

        <tab-view>
            <tab-item :title="$gettext('general informations')">

                <field-simple :document="document" :base="locale" :field="fields.title"/>
                <field-simple :document="document" :field="fields.activities"/>
                <field-simple :document="document" :field="fields.book_types" />
                <field-simple :document="document" :field="fields.author" />
                <field-simple :document="document" :field="fields.editor" />
                <field-simple :document="document" :field="fields.langs" />
                <field-simple :document="document" :field="fields.publication_date" />
                <field-simple :document="document" :field="fields.nb_pages" />
                <field-simple :document="document" :field="fields.isbn" />
                <field-simple :document="document" :field="fields.url" class="is-8" />

            </tab-item>

            <tab-item :title="$gettext('description')">
                <field-simple :document="document" :base="locale" :field="fields.summary"/>
                <field-simple :document="document" :base="locale" :field="fields.description"/>
            </tab-item>

        </tab-view>

    </edition-container>
</template>

<script>

    import mixins from './utils/mixins.js'

    export default {
        mixins : [
            mixins,
        ],
    }
</script>
