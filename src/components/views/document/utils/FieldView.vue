<template>
    <label-value v-if="hasValue" :label="field.label">
        <a v-if="field.type==='url'" :href="value">
            {{ value }}
        </a>
        <span v-else>
            <span>
                {{ isArray ? value.join(", ") : value }}
            </span>
            <span v-if="field.unit">
                {{ field.unit }}
            </span>
        </span>
    </label-value>
</template>

<script>
    import { requireDocumentProperty, requireFieldProperty } from '@/js/propertiesMixins.js'

    import LabelValue from './LabelValue'

    export default {
        components : {LabelValue},

        mixins : [ requireDocumentProperty, requireFieldProperty ],

        computed : {
            value(){
                return this.document[this.field.name]
            },

            isArray(){
                return Array.isArray(this.value)
            },

            hasValue(){

                if(this.value === undefined || this.value === null)
                    return false

                if(this.isArray && this.value.length===0)
                    return false

                return true
            }
        }
    }
</script>
