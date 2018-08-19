<template>
    <div>
        <div class="field">
              <div class="control">
                  <h2>Title</h2>
                  <input class="input is-primary" type="text" v-model="locale.title">
              </div>
        </div>

        <input-base :document="document" :field="field.activities" />
        <input-base :document="document" :field="field.categories" />
        <input-base :document="document" :field="field.image_type" />
        <input-base :document="document" :field="field.author" />
        <input-base :document="document" :field="field.elevation" />
        <input-base :document="document" :field="field.height" />
        <input-base :document="document" :field="field.width" />
        <input-base :document="document" :field="field.file_size" />
        <input-base :document="document" :field="field.filename" />
        <input-base :document="document" :field="field.camera_name" />
        <input-base :document="document" :field="field.exposure_time" />
        <input-base :document="document" :field="field.focal_length" />
        <input-base :document="document" :field="field.fnumber" />
        <input-base :document="document" :field="field.iso_speed" />
        <input-base :document="document" :field="field.quality" />

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
