<template>
    <div>
        <edit-section :document="document" header="general informations">

            <input-base class="is-12" :document="document" :base="locale" :field="fields.title" />
            <input-activities class="is-6" :document="document" />
            <input-checkboxes class="is-6" :document="document" :field="fields.book_types" />
            <input-base class="is-6" :document="document" :field="fields.author" />
            <input-base class="is-6" :document="document" :field="fields.editor" />
            <input-checkboxes class="is-4" :document="document" :field="fields.langs" />
            <input-base class="is-4" :document="document" :field="fields.publication_date" />
            <input-base class="is-4" :document="document" :field="fields.nb_pages" />
            <input-base class="is-4" :document="document" :field="fields.isbn" />
            <input-base class="is-8" :document="document" :field="fields.url" />

        </edit-section>

        <edit-section :document="document" header="description">
            <input-base class="is-12" :document="document" :base="locale" :field="fields.summary"/>
            <input-base class="is-12" :document="document" :base="locale" :field="fields.description"/>
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

        props : ["document", "locale", "objectDefinition"],

        data(){
            return {
                fields : this.objectDefinition.fields,
            }
        },
    }
</script>
