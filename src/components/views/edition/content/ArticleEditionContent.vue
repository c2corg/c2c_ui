<template>
    <div>
        <input-base :document="document" :base="locale" :field="localeFields.title" />

        <input-base :document="document" :field="fields.activities" />
        <input-base :document="document" :field="fields.categories" />
        
        <input-base :document="document" :base="locale" :field="localeFields.summary"/>
        <input-base :document="document" :base="locale" :field="localeFields.description"/>

    </div>
</template>

<script>
    import InputBase from './utils/InputBase'
    import InputMarkdown from './utils/InputMarkdown'

    export default {
        components:{
            InputBase,
            InputMarkdown,
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
