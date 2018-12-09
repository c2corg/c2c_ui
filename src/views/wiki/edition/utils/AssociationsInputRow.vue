<template>
    <form-row
        :label="label || $gettext(field.name)"
        :helper="helper !== undefined ? helper : field.helper"
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
                        @delete="$documentUtils.removeAssociation(document, child)"
                        not-clickable/>
                </div>
            </div>
        </div>
    </form-row>
</template>

<script>

    import FormRow from './FormRow'
    import FormInput from './FormInput'

    import { requireDocumentProperty, requireFieldProperty } from '@/js/properties-mixins'

    export default {
        components: {
            FormRow,
            FormInput
        },

        mixins: [ requireFieldProperty, requireDocumentProperty ],

        props: {
            label: {
                type: String,
                default: null
            },

            helper: {
                type: String,
                default: undefined // default must be undefined. null means explicit no helper
            }
        },

        computed: {
            visible() {
                return this.$refs.input.visible
            },
            hasError() {
                return this.$refs.input.hasError === true
            }
        }
    }
</script>
