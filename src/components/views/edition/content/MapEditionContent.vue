<template>
    <div>
        <edit-section :document="document" header="general information">
            <div class="columns">
                <div class="column">
                    <input-base :document="document" :base="locale" :field="localeFields.title"/>
                </div>
            </div>

            <div class="columns">
                <div class="column">
                    <input-base :document="document" :field="fields.editor" />
                </div>
                <div class="column">
                    <input-base :document="document" :field="fields.scale" />
                </div>
                <div class="column">
                    <input-base :document="document" :field="fields.code" />
                </div>
            </div>
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
