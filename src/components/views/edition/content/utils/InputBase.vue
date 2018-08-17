<template>
    <div class="field">
        <label>
                {{field.label}}
        </label>

        <div v-if="field.type == 'text' || field.type=='number'" class="control" :class="{'has-icons-right':field.unit}">
             <input class="input"
                :type="field.type"
                :min="field.min"
                v-model="document[field.name]">

            <span class="icon is-right" v-if="field.unit">
                {{field.unit}}
            </span>
         </div>

         <div v-else-if="field.values" class="control">
             <div class="select">
                 <select v-model="document[field.name]">
                     <option v-for="value of field.values"
                             :value="value" :key="value">
                         {{value}}
                     </option>
                 </select>
             </div>
          </div>

         <div v-else class="notification is-danger">
             unknown field type : {{field.type}}
         </div>

    </div>
</template>

<script>
    export default {
        props:["document", "field"]
    }
</script>
