<template>
    <form-row
        :label="label || $gettext(field.name)"
        :helper="helper === undefined ? field.helper : helper"
        always-visible
        is-grouped>
        <form-input ref="input" :document="document" :field="field" />

        <div class="control is-expanded">
            <div class="columns is-multiline ">
                <div
                    v-for="child in document.associations[field.name]"
                    :key="child.document_id"
                    class="column is-4">
                    <document-card
                        :document="child"
                        show-delete-button
                        @delete="$documentUtils.removeAssociation(document, child)"/>
                </div>
            </div>
        </div>
    </form-row>
</template>

<script>

    import FormRow from './FormRow'
    import FormInput from './FormInput'

    import { requireDocumentProperty, requireFieldProperty } from '@/js/propertiesMixins.js'

    export default {
        components: {
            FormRow,
            FormInput,
        },

        mixins : [ requireFieldProperty, requireDocumentProperty ],

        props : {
            label:{
                type:String,
                default:undefined,
            },

            helper:{
                type:String,
                default:undefined,
            }
        },

        computed: {
            visible(){
                return this.$refs.input.visible
            },
            hasError(){
                return this.$refs.input.hasError === true
            }
        }
    }
</script>
