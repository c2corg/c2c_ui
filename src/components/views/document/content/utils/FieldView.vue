<template>
    <label-value v-if="hasValue" :label="field.label">
        {{ isArray ? value.join(", ") : value }}
        <span v-if="field.unit">
            {{field.unit}}
        </span>
    </label-value>
</template>

<script>

    import LabelValue from './LabelValue'

    export default {
        components : {LabelValue},

        props : ['document', 'field'],

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
