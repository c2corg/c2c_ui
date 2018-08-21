<template>
    <div>
        <edit-section expanded="true" header="general information">
            <input-base class="is-9" :document="document" :base="locale" :field="localeFields.title" />
            <input-base class="is-3" :document="document" :field="fields.article_type" />
            <input-activities class="is-6" :document="document" />
            <input-checkboxes class="is-6" :document="document" :field="fields.categories" />
        </edit-section>

        <edit-section expanded="true" :document="document" header="description">
            <input-base class="is-12" :document="document" :base="locale" :field="localeFields.summary"/>
            <input-base class="is-12" :document="document" :base="locale" :field="localeFields.description"/>
        </edit-section>

    </div>
</template>

<script>
    import InputBase from './utils/InputBase'
    import InputActivities from './utils/InputActivities'
    import InputCheckboxes from './utils/InputCheckboxes'
    import EditSection from './utils/EditSection'

    export default {
        components:{
            InputBase,
            InputActivities,
            InputCheckboxes,
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
