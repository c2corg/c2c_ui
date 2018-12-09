<template>
    <label-value v-if="value1 && value2" :label="label">
        <span>{{ signPlus }}{{ value1 }}&nbsp;{{ field1.unit }}</span>
        <span>&nbsp;/&nbsp;</span>
        <span>{{ signMinus }}{{ value2 }}&nbsp;{{ field2.unit }}</span>
    </label-value>
    <field-view v-else-if="value1" :document="document" :field="field1" />
    <field-view v-else-if="value2" :document="document" :field="field2" />
</template>

<script>
    import { requireDocumentProperty } from '@/js/properties-mixins'

    import LabelValue from './LabelValue'
    import FieldView from './FieldView'

    export default {

        components: {
            LabelValue,
            FieldView
        },

        mixins: [ requireDocumentProperty ],

        props: {
            field1: {
                type: Object,
                required: true
            },
            field2: {
                type: Object,
                required: true
            },
            label: {
                type: String,
                required: true
            },
            showSigns: {
                type: Boolean,
                default: false
            }
        },

        computed: {
            value1() {
                return this.document[this.field1.name]
            },
            value2() {
                return this.document[this.field2.name]
            },
            signPlus() {
                return this.showSigns ? '+' : ''
            },
            signMinus() {
                return this.showSigns ? '-' : ''
            }
        }
    }
</script>
