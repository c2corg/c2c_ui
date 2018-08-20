<template>
    <div>
        <edit-section>
            <template slot="header">
                general information
            </template>

            <div class="columns">
                <div class="column">
                    <input-base :document="document" :base="locale" :field="localeFields.title" />
                </div>
                <div class="column is-narrow">
                    <input-base :document="document" :field="fields.article_type" />
                </div>
            </div>

            <div class="columns">
                <div class="column">
                    <input-activities :document="document" />
                </div>
                <div class="column">
                    <input-checkboxes :document="document" :field="fields.categories" />
                </div>
            </div>
        </edit-section>

        <edit-section>
            <template slot="header">
                description
            </template>
            <input-base :document="document" :base="locale" :field="localeFields.summary"/>
            <input-base :document="document" :base="locale" :field="localeFields.description"/>
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
