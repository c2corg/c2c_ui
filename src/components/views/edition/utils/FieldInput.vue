<template>
    <div
        v-show="visible"
        class="field"
        :class="{'has-addons':prefix || field.unit}">

        <p v-if="prefix" class="control">
            <a class="button is-static">
                {{ prefix }}
            </a>
        </p>

        <p v-if="field.name=='activities'" class="control">
            <input-activity v-model="document.activities" />
        </p>


        <p v-else-if="field.name=='orientations'" class="control">
            <input-orientation v-model="document.orientations" />
        </p>

        <div v-else-if="field.values && (field.type == 'text' || field.type=='number')" class="control">
            <div :class="{'is-multiple':field.multiple}" class="select">
                <select v-model="object[field.name]"
                        :multiple="!!field.multiple">
                    <option v-if="!field.required"/>
                    <option
                        v-for="value of field.values"
                        :key="value"
                        :value="value">
                        {{ field.i18n ? $gettext(value) : value }}
                    </option>
                </select>
            </div>
        </div>

        <p
            v-else-if="['text', 'number', 'url', 'date', 'tel'].indexOf(field.type) !=-1"
            class="control">

            <input :type="field.type"
                   :min="field.min"
                   :man="field.max"
                   :disabled="field.disabled"
                   :placeholder="$gettext(field.name)"
                   v-model="object[field.name]"
                   class="input">
        </p>

        <markdown-editor
            v-else-if="field.type=='markdown'"
            v-model="object[field.name]"/>

        <div class="control" v-else-if="field.type=='boolean'">
            <label class="radio">
                <input type="radio" :value="true" v-model="object[field.name]">
                <span v-translate>Yes</span>
            </label>
            <label class="radio">
                <input type="radio" :value="null" v-model="object[field.name]">
                <span v-translate>No</span>
            </label>
        </div>

        <div v-else class="notification is-danger">
            <!-- Should not happen, message to devs -->
            Unknown field type : {{ field.type }}
        </div>


        <p v-if="field.unit" class="control">
            <a class="button is-static">
                {{ field.unit }}
            </a>
        </p>
    </div>
</template>


<script>
    import { requireDocumentProperty, requireFieldProperty } from '@/js/propertiesMixins.js'

    import MarkdownEditor from '@/components/markdownEditor/MarkdownEditor'

    export default {

        components: {
            MarkdownEditor,
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
            }
        },

        created(){
            this.object = this.base || this.document

            if(this.field.values && (this.field.type=="text" || this.field.type == "number")){
                if(!this.document[this.field.name]){
                    this.document[this.field.name] = []
                }
            }
        }
    }
</script>
