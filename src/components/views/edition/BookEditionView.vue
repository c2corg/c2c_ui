<template>
    <edition-container
        v-if="document"
        :document="document"
        :locale="locale">
        <div>
            <edit-section :document="document" header="general informations">

                <input-base :document="document" :base="locale" :field="fields.title" class="is-12" />
                <input-activities :document="document" class="is-6" />
                <input-checkboxes :document="document" :field="fields.book_types" class="is-6" />
                <input-base :document="document" :field="fields.author" class="is-6" />
                <input-base :document="document" :field="fields.editor" class="is-6" />
                <input-checkboxes :document="document" :field="fields.langs" class="is-4" />
                <input-base :document="document" :field="fields.publication_date" class="is-4" />
                <input-base :document="document" :field="fields.nb_pages" class="is-4" />
                <input-base :document="document" :field="fields.isbn" class="is-4" />
                <input-base :document="document" :field="fields.url" class="is-8" />

            </edit-section>

            <edit-section :document="document" header="description">
                <input-base :document="document" :base="locale" :field="fields.summary" class="is-12"/>
                <input-base :document="document" :base="locale" :field="fields.description" class="is-12"/>
            </edit-section>

        </div>
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
