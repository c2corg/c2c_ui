<template>
    <div class="field" v-if="hasField(document, field)">
        <label>
            {{field.label}} {{document[field.name]}}
        </label>

        <div v-if="field.values && (field.type == 'text' || field.type=='number')" class="control">
            <div class="select" :class="{'is-multiple':field.multiple}">
                 <select v-model="document[field.name]"
                         :multiple="!!field.multiple">
                     <option v-for="value of field.values"
                             :value="value" :key="value">
                         {{value}}
                     </option>
                 </select>
             </div>
        </div>

        <div v-else-if="field.type == 'text' || field.type=='number'" class="control" :class="{'has-icons-right':field.unit}">
            <input class="input"
                :type="field.type"
                :min="field.min"
                v-model="document[field.name]">

            <span class="icon is-right" v-if="field.unit">
                {{field.unit}}
            </span>
        </div>

        <div v-else class="notification is-danger">
            unknown field type : {{field.type}}
        </div>

    </div>
</template>

<script>
    import constants from "@/js/constants.js"

    export default {
        props:["document", "field"],
        methods:{hasField:constants.hasField}
    }
</script>
