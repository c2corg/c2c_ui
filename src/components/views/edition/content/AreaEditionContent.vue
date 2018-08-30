<template>
    <div>
        <edit-section :document="document" header="general informations" :expanded="true">
            <input-base :document="document" :base="locale" :field="localeFields.title"/>
            <input-base class="is-narrow" :document="document" :field="fields.area_type"/>
        </edit-section>

        <edit-section :document="document" header="Description" :expanded="true">
            <input-base class="is-12" :document="document" :base="locale" :field="localeFields.summary"/>
            <input-base class="is-12" :document="document" :base="locale" :field="localeFields.description"/>
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
