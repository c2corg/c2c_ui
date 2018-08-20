<template>
    <div>
        <div class="field">
              <div class="control">
                  <h2>Title</h2>
                  <input class="input is-primary" type="text" v-model="locale.title">
              </div>
        </div>

        <input-activities :document="document" />
        <input-base :document="document" :field="fields.categories" />
        <input-base :document="document" :field="fields.quality" />
        <input-base :document="document" :field="fields.article_type" />

        <input-markdown :document="document" :locale="locale" :field="localeFields.summary"/>
        <input-markdown :document="document" :locale="locale" :field="localeFields.description"/>


    </div>
</template>

<script>
    import InputBase from './utils/InputBase'
    import InputActivities from './utils/InputActivities'
    import EditSection from './utils/EditSection'

    export default {
        components:{
            InputBase,
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
