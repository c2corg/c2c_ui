<template>
    <label-value v-if="hasValue" :label="$gettext(field.name)">
        <document-field :document="document" :field="field" />
    </label-value>
</template>

<script>
    import { requireDocumentProperty, requireFieldProperty } from '@/js/propertiesMixins.js'

    import LabelValue from './LabelValue'

    export default {
        components : {LabelValue},

        mixins : [ requireDocumentProperty, requireFieldProperty ],

        computed : {
            hasValue(){
                const value = this.document[this.field.name]

                if(value === undefined || value === null)
                    return false

                if(Array.isArray(value) && value.length===0)
                    return false

                return true
            }
        }
    }
</script>
