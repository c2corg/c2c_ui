<template>
    <div>
        <edit-section header="general information">

            <input-activities class="is-6" :document="document" />
            <input-checkboxes class="is-6" :document="document" :field="fields.categories" />

            <input-base class="is-12" :document="document" :locale="locale" :field="localeFields.summary"/>
            <input-base class="is-12" :document="document" :locale="locale" :field="localeFields.description"/>

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
