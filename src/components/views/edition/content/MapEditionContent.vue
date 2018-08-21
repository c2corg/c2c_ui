<template>
    <div>
        <edit-section expanded="true" :document="document" header="general information">
            <input-base class="is-12" :document="document" :base="locale" :field="localeFields.title"/>

            <input-base :document="document" :field="fields.editor" />
            <input-base :document="document" :field="fields.scale" />
            <input-base :document="document" :field="fields.code" />
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
