<template>
    <!-- This a generic component that display field of a document for any kind of field  -->
    <span>

        <activities v-if="field.name=='activities'" :activities="document.activities" />

        <a v-else-if="field.type==='url'" :href="value">
            {{ value }}
        </a>

        <textual-array v-else-if="isArray" :array="value"/>

        <span v-else-if="typeof(value) === 'boolean'">
            <span v-if="value" v-translate>
                yes
            </span>
            <span v-else v-translate>
                no
            </span>
        </span>

        <span v-else-if="field.i18n">
            {{ $gettext(value) }}
        </span>

        <span v-else>
            {{ value }}
        </span>

        <span v-if="field.unit && value !== null">
            {{ field.unit }}
        </span>

    </span>
</template>

<script>
    import { requireDocumentProperty, requireFieldProperty } from '@/js/propertiesMixins.js'

    export default {

        mixins : [ requireDocumentProperty, requireFieldProperty ],

        computed : {
            value(){
                return this.document[this.field.name]
            },

            isArray(){
                return Array.isArray(this.value)
            }
        }
    }
</script>
