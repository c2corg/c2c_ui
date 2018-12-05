<template>
    <form-row
        :label="label || $gettext(field.name)"
        :helper="helper === undefined ? field.helper : helper"
        :is-expanded="isExpanded || field.type=='markdown'"
        :is-narrow="!isExpanded && field.type!='markdown'">
        <form-input
            ref="input"
            :document="document"
            :field="field"
            :helper="null"
            :is-expanded="isExpanded"/>
    </form-row>
</template>

<script>

    import FormRow from './FormRow'
    import FormInput from './FormInput'

    import { requireDocumentProperty, requireFieldProperty } from '@/js/properties-mixins'

    // import MarkdownEditor from '@/components/markdownEditor/MarkdownEditor'

    export default {
        components: {
            FormRow,
            FormInput
        },

        mixins: [ requireFieldProperty, requireDocumentProperty ],

        props: {
            isExpanded: {
                type: Boolean,
                default: false
            },
            helper: {
                type: String,
                default: undefined
            },
            label: {
                type: String,
                default: undefined
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
