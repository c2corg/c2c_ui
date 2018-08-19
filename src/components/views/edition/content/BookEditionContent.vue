<template>
    <div>
        <input-base :document="document" :base="locale" :field="localeFields.title" />

        <input-base :document="document" :field="fields.author" />
        <input-base :document="document" :field="fields.editor" />
        <input-base :document="document" :field="fields.activities" />
        <input-base :document="document" :field="fields.url" />
        <input-base :document="document" :field="fields.isbn" />
        <input-base :document="document" :field="fields.book_types" />
        <input-base :document="document" :field="fields.publication_date" />
        <input-base :document="document" :field="fields.langs" />
        <input-base :document="document" :field="fields.nb_pages" />

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
