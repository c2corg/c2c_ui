<template>
    <div class="column" v-show="visible">
        <div
            class="field"
            :helper="helper === undefined ? field.helper : helper"
            :is-expanded="isExpanded || field.type=='markdown'"
            :is-narrow="!isExpanded && field.type!='markdown'">
            <label class="label"> {{ label || $gettext(field.name) }} </label>
            <form-input
                ref="input"
                :document="document"
                :field="field"
                :helper="null"
                :placeholder="placeholder"
                :unit="unit"
                :divisor="divisor"
                :is-expanded="isExpanded"/>
        </div>
    </div>
</template>

<script>
    import FormInput from './FormInput'

    import { requireDocumentProperty, requireFieldProperty } from '@/js/properties-mixins'

    export default {
        components: {
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
            },
            placeholder: {
                type: String,
                default: ' ' // hack to force explicit placeholder
            },
            unit: {
                type: String,
                default: undefined
            },
            divisor: {
                type: Number,
                default: undefined
            }
        },

        data() {
            return {
                visible: true,
                hasError: false
            }
        },

        mounted() {
            this.$refs.input.$watch('visible', () => {
                this.visible = this.$refs.input.visible
            })
            this.$refs.input.$watch('hasError', () => {
                this.hasError = this.$refs.input.hasError
            })

            this.visible = this.$refs.input.visible
            this.hasError = this.$refs.input.hasError
        }
    }
</script>
