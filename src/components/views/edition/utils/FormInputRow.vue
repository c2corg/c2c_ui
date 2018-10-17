<template>
    <form-row
        :label="$gettext(field.name)"
        :is-expanded="isExpanded || field.type=='markdown'"
        :is-narrow="!isExpanded && field.type!='markdown'">
        <form-input
            ref="input"
            :document="document"
            :field="field"
            :is-expanded="isExpanded"/>
    </form-row>
</template>

<script>

    import FormRow from './FormRow'
    import FormInput from './FormInput'

    import { requireDocumentProperty, requireFieldProperty } from '@/js/propertiesMixins.js'

    // import MarkdownEditor from '@/components/markdownEditor/MarkdownEditor'

    export default {
        components: {
            FormRow,
            FormInput,
        },

        mixins : [ requireFieldProperty, requireDocumentProperty ],

        props : {
            isExpanded:{
                type:Boolean,
                default:false
            },
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
