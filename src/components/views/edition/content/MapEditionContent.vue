<template>
    <div>
        <div class="field">
              <div class="control">
                  <h2>Title</h2>
                  <input class="input is-primary" type="text" v-model="locale.title">
              </div>
        </div>

        <input-base :document="document" :field="field.editor" />
        <input-base :document="document" :field="field.scale" />
        <input-base :document="document" :field="field.code" />

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
