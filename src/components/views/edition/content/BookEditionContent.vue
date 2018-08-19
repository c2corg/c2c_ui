<template>
    <div>
        <div class="field">
              <div class="control">
                  <h2>Title</h2>
                  <input class="input is-primary" type="text" v-model="locale.title">
              </div>
        </div>

        <input-base :document="document" :field="field.author" />
        <input-base :document="document" :field="field.editor" />
        <input-base :document="document" :field="field.activities" />
        <input-base :document="document" :field="field.url" />
        <input-base :document="document" :field="field.isbn" />
        <input-base :document="document" :field="field.book_types" />
        <input-base :document="document" :field="field.publication_date" />
        <input-base :document="document" :field="field.langs" />
        <input-base :document="document" :field="field.nb_pages" />

        <input-markdown :document="document" :locale="locale" :field="localeFields.summary"/>
        <input-markdown :document="document" :locale="locale" :field="localeFields.description"/>


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
