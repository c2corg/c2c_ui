<template>
    <div>
        <edit-section :document="document" header="general informations">

            <input-base :document="document" :base="locale" :field="localeFields.title" />
            <input-activities :document="document" />

            <div class="columns is-multiline">
                <div class="column is-6">
                    <input-checkboxes :document="document" :field="fields.book_types" />
                </div>
                <div class="column is-6">
                    <input-checkboxes :document="document" :field="fields.langs" />
                </div>
                <div class="column is-6">
                    <input-base :document="document" :field="fields.author" />
                </div>
                <div class="column is-6">
                    <input-base :document="document" :field="fields.editor" />
                </div>
                <div class="column is-6">
                    <input-base :document="document" :field="fields.publication_date" />
                </div>
                <div class="column is-6">
                    <input-base :document="document" :field="fields.nb_pages" />
                </div>
                <div class="column is-6">

                    <input-base :document="document" :field="fields.isbn" />
                </div>
                <div class="column is-6">
                    <input-base :document="document" :field="fields.url" />
                </div>
            </div>

        </edit-section>

        <edit-section :document="document" header="description">
            <input-base :document="document" :base="locale" :field="localeFields.summary"/>
            <input-base :document="document" :base="locale" :field="localeFields.description"/>
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
                localeFields : this.objectDefinition.localeFields,
            }
        },
    }
</script>
