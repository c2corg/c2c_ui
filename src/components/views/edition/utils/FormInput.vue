<template>
    <input-activity
        v-if="field.name=='activities'"
        v-show="visible"
        :hasError="hasError"
        v-model="document.activities" />

    <input-orientation
        v-else-if="field.name=='orientations'"
        v-show="visible"
        v-model="document.orientations" />

    <input-markdown
        v-else-if="field.type=='markdown'"
        v-show="visible"
        v-model="object[field.name]"/>

    <input-multi-select
        v-else-if="field.values && field.multiple"
        v-show="visible"
        :options="field.values"
        :required="field.required"
        :i18n="field.i18n"
        :hasError="hasError"
        v-model="object[field.name]"/>

    <input-simple
        ref="input"
        v-else-if="simpleInputType"
        v-show="visible"
        :prefix="prefix"
        :is-expanded="isExpanded"
        :postfix="field.unit"
        :type="field.type"
        :min="field.min"
        :man="field.max"
        :disabled="field.disabled"
        :placeholder="$gettext(field.name)"
        :required="field.required"
        :i18n="field.i18n"
        :options="field.values"
        :hasError="hasError"
        v-model="object[field.name]"
        />

    <input-yes-no
        v-else-if="field.type=='boolean'"
        v-show="visible"
        v-model="object[field.name]" />

    <div v-else class="notification is-danger">
        <!-- Should not happen, message to devs -->
        Unknown field type : {{ field.type }}
    </div>

</template>


<script>
    import { requireDocumentProperty, requireFieldProperty } from '@/js/propertiesMixins.js'


    export default {

        mixins : [ requireFieldProperty, requireDocumentProperty ],

        props : {
            prefix:{
                type:String,
                default:undefined,
            },
            isExpanded:{
                type:Boolean,
                default:undefined,
            }
        },

        computed: {
            object(){
                return this.field.parent == "locales" ? this.document.currentLocale_ : this.document
            },
            visible(){
                return this.field.isVisibleFor(this.document)
            },
            simpleInputType(){
                return ['text', 'number', 'url', 'date', 'tel'].includes(this.field.type)
            },
            hasError(){
                return this.field.error !== null 
            }
        },
    }
</script>
