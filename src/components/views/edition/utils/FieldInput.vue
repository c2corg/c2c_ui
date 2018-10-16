<template>
    <div v-show="visible" class="control" :class="{'is-expanded':isExpanded || field.type=='markdown'}">
        <input-activity v-if="field.name=='activities'" v-model="document.activities" />

        <input-orientation v-else-if="field.name=='orientations'" v-model="document.orientations" />

        <select-input
            v-else-if="field.values && (field.type == 'text' || field.type=='number')"
            :document="document"
            :field="field"
            :prefix="prefix" />

        <markdown-editor v-else-if="field.type=='markdown'" v-model="object[field.name]"/>

        <div
            v-else-if="simpleInputType && (field.unit || prefix)"
            class="field"
            :class="{'has-addons':prefix || field.unit}">

            <div v-if="prefix" class="control">
                <span class="button is-static">
                    <span class="is-first-letter-uppercase">
                        {{ prefix }}
                    </span>
                </span>
            </div>

            <div class="control" :class="{'is-expanded':isExpanded}">
                <input :type="field.type"
                       :min="field.min"
                       :man="field.max"
                       :disabled="field.disabled"
                       :placeholder="$gettext(field.name)"
                       v-model="object[field.name]"
                       class="input">
            </div>

            <div v-if="field.unit" class="control">
                <span class="button is-static">
                    {{ field.unit }}
                </span>
            </div>
        </div>


        <input
            v-else-if="simpleInputType"
            :type="field.type"
            :min="field.min"
            :man="field.max"
            :disabled="field.disabled"
            :placeholder="$gettext(field.name)"
            v-model="object[field.name]"
            class="input">

        <div v-else-if="field.type=='boolean'" class="field">

            <input class="is-checkradio" type="radio" :id="field.name + '1'" :value="true" v-model="object[field.name]">
            <label :for="field.name + '1'" v-translate>yes</label>
            <input class="is-checkradio" type="radio" :id="field.name + '2'" :value="null" v-model="object[field.name]">
            <label :for="field.name + '2'" v-translate>no</label>

        </div>

        <div v-else class="notification is-danger">
            <!-- Should not happen, message to devs -->
            Unknown field type : {{ field.type }}
        </div>
    </div>
</template>


<script>
    import { requireDocumentProperty, requireFieldProperty } from '@/js/propertiesMixins.js'

    import MarkdownEditor from '@/components/markdownEditor/MarkdownEditor'
    import SelectInput from './SelectInput'

    export default {

        components: {
            MarkdownEditor,
            SelectInput,
        },

        mixins : [ requireFieldProperty, requireDocumentProperty ],

        props : {
            base:{
                type:Object,
                default: undefined,
            },
            prefix:{
                type:String,
                default:null,
            },
            isExpanded:{
                type:Boolean,
                default:false
            },
        },


        data(){
            return {
                object:null,
                values:null,
            }
        },

        computed: {
            visible(){
                return this.field.isVisibleFor(this.document)
            },

            simpleInputType(){
                return ['text', 'number', 'url', 'date', 'tel'].includes(this.field.type)
            }
        },

        created(){
            this.object = this.base || this.document
        }
    }
</script>

<style scoped>
</style>
