<template>
    <field-row :label="$gettext(field.name)">
        <field-input
            ref="input"
            :document="document"
            :base="base"
            :field="field"
            :is-expanded="isExpanded"/>
    </field-row>
</template>

<script>

    import FieldRow from './FieldRow'
    import FieldInput from './FieldInput'

    import { requireDocumentProperty, requireFieldProperty } from '@/js/propertiesMixins.js'

    // import MarkdownEditor from '@/components/markdownEditor/MarkdownEditor'

    export default {
        components: {
            FieldRow,
            FieldInput,
        },

        mixins : [ requireFieldProperty, requireDocumentProperty ],

        props : {
            base:{
                type:Object,
                default: undefined,
            },
            isExpanded:{
                type:Boolean,
                default:false
            },
        },

        computed: {
            visible(){
                return this.$refs.input.visible
            }
        }
    }
</script>
