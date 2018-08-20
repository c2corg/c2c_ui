<template>
    <div>
        <edit-section :document="document" header="general informations">
            <div class="columns">
                <div class="column">
                    <input-base :document="document" :base="locale" :field="localeFields.title"/>
                </div>
                <div class="column is-narrow">
                    <input-base :document="document" :field="fields.area_type"/>
                </div>
            </div>
        </edit-section>

        <edit-section :document="document" header="Description">
            <input-base :document="document" :base="locale" :field="localeFields.summary"/>
            <input-base :document="document" :base="locale" :field="localeFields.description"/>
        </edit-section>

    </div>
</template>

<script>
    import InputBase from './utils/InputBase'
    import EditSection from './utils/EditSection'

    export default {
        components:{
            InputBase,
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
