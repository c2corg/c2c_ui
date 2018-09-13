<template>
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
</template>

<script>
    import InputBase from './utils/InputBase'
    import InputCheckboxes from './utils/InputCheckboxes'
    import InputActivities from './utils/InputActivities'
    import EditSection from './utils/EditSection'

    export default {
        components:{
            InputBase,
            InputCheckboxes,
            InputActivities,
            EditSection,
        },

        props : ["document", "locale", "fields"],
    }
</script>
