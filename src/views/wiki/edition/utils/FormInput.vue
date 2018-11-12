<template>
    <input-activity
        v-if="field.name=='activities'"
        v-show="visible"
        :error-message="errorMessage"
        v-model="document.activities" />

    <input-orientation
        v-else-if="field.name=='orientations'"
        v-show="visible"
        v-model="document.orientations" />

    <div
        v-else-if="field.name=='main_waypoint_id'"
        class="control select"
        :class="{'is-danger': hasError}">
        <select v-model="document.main_waypoint_id">
            <option :value="null"/>
            <option
                v-for="waypoint of document.associations.waypoints"
                :key="waypoint.document_id"
                :value="waypoint.document_id">
                {{ $documentUtils.getDocumentTitle(waypoint) }}
            </option>
        </select>
    </div>

    <input-conditions-levels
        v-else-if="field.name=='conditions_levels'"
        v-model="object[field.name]"/>

    <input-markdown
        v-else-if="field.type=='markdown'"
        v-show="visible"
        v-model="object[field.name]"/>

    <input-document
        v-else-if="field.parent=='associations'"
        :document-type="field.documentType"
        multiple
        :error-message="errorMessage"
        @add="$documentUtils.propagateAssociationProperties(document, arguments[0])"
        v-model="object[field.name]"/>

    <input-multi-select
        v-else-if="field.values && field.multiple"
        v-show="visible"
        :options="field.values"
        :required="field.required"
        :i18n="field.i18n"
        :error-message="errorMessage"
        v-model="object[field.name]"/>

    <input-simple
        ref="input"
        v-else-if="simpleInputType"
        v-show="visible"
        :prefix="prefix"
        @click:prefix="$emit('click:prefix')"
        :helper="helper===undefined ? field.helper : helper"
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
        :error-message="errorMessage"
        @input="$emit('input', arguments[0])"
        v-model="object[field.name]"/>

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
    import InputConditionsLevels from './InputConditionsLevels'


    export default {
        components : { InputConditionsLevels },

        mixins : [ requireFieldProperty, requireDocumentProperty ],

        props : {
            prefix:{
                type:String,
                default:null,
            },
            isExpanded:{
                type:Boolean,
                default:null,
            },
            helper:{
                type:String,
                default:undefined,
            }
        },

        computed: {
            object(){
                if(this.field.parent == "document")
                    return this.document

                if(this.field.parent == "locales")
                    return this.document.currentLocale_

                if(this.field.parent == "associations")
                    return this.document.associations

                throw `Unexpected parent value : ${this.field.parent}`
            },
            visible(){
                return this.field.isVisibleFor(this.document)
            },
            simpleInputType(){
                return ['text', 'number', 'url', 'date', 'tel'].includes(this.field.type)
            },
            hasError(){
                return this.field.error !== null
            },
            errorMessage(){
                return this.hasError ? this.$gettext(this.field.error.description) : null
            }
        },
    }
</script>
