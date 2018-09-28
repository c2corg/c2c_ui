<template>
    <div v-if="field.isVisibleFor(document)" class="column">
        <div class="field">
            <label >
                <span>{{ $gettext(field.name) }}</span>
                <span v-if="field.required">*</span>
            </label>

            <div v-if="field.values && (field.type == 'text' || field.type=='number')" class="control">
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

            <div v-else-if="['text', 'number', 'url', 'date'].indexOf(field.type) !=-1" :class="{'has-icons-right':field.unit}" class="control">
                <input :type="field.type"
                       :min="field.min"
                       :man="field.max"
                       :disabled="field.disabled"
                       v-model="object[field.name]"
                       class="input">

                <span v-if="field.unit" class="icon is-right">
                    {{ field.unit }}
                </span>
            </div>

            <div v-else-if="field.type=='markdown'">
                <textarea v-model="object[field.name]" class="textarea"/>
            </div>

            <div v-else class="notification is-danger">
                <!-- Should not happen, message to devs -->
                Unknown field type : {{ field.type }}
            </div>

        </div>
    </div>
</template>

<script>
    import { requireDocumentProperty, requireFieldProperty } from '@/js/propertiesMixins.js'

    export default {

        mixins : [ requireFieldProperty, requireDocumentProperty ],

        props : {
            base:{
                type:Object,
                default: undefined,
            },
        },

        data(){
            return {
                object:null,
                values:null,
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

<style scoped>

.select{
    width:100%;
    display:block !important;
}

select{
    width:100%
}

</style>
