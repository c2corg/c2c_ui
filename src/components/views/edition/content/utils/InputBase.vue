<template>
    <div class="column"  v-if="field.isVisibleFor(document)">
        <div class="field">
            <label>
                {{field.label}}
                <span v-if="field.required">*</span>
            </label>

            <div v-if="field.values && (field.type == 'text' || field.type=='number')" class="control">
                <div class="select" :class="{'is-multiple':field.multiple}">
                     <select v-model="object[field.name]"
                             :multiple="!!field.multiple">
                         <option v-if="!field.required"></option>
                         <option v-for="value of field.values"
                                 :value="value" :key="value">
                             {{value}}
                         </option>
                     </select>
                 </div>
            </div>

            <div v-else-if="['text', 'number', 'url', 'date'].indexOf(field.type) !=-1" class="control" :class="{'has-icons-right':field.unit}">
                <input class="input"
                    :type="field.type"
                    :min="field.min"
                    :man="field.max"
                    :disabled="field.disabled"
                    v-model="object[field.name]">

                <span class="icon is-right" v-if="field.unit">
                    {{field.unit}}
                </span>
            </div>

            <div v-else-if="field.type=='markdown'">
                  <textarea class="textarea" v-model="object[field.name]"/>
            </div>

            <div v-else class="notification is-danger">
                unknown field type : {{field.type}}
            </div>

        </div>
    </div>
</template>

<script>

    export default {
        props:["document", "base", "field"],

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
