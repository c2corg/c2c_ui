<template>
    <div class="field">
        <label class="label">
            {{ label }}
            <span v-if="required">*</span>

            <span class="has-text-danger has-text-weight-bold" v-if="errorMessage">
                {{ errorMessage }}
            </span>
        </label>
        <div class="control has-icons-left">
            <input
                :type="type"
                :placeholder="placeholder || label"
                :required="required"
                :disabled="disabled"
                v-model="value_"
                class="input"
                :class="{'is-danger':hasError || errorMessage}">
            <span class="icon is-small is-left">
                <fa-icon :icon="icon"/>
            </span>
        </div>
    </div>
</template>

<script>
    export default {
        props:{
            name: {
                type:String,
                required:true,
            },
            value: {
                type:[String, Number, Boolean],
                default:null,
            },
            label: {
                type:String,
                required:true,
            },
            type: {
                type:String,
                required:true,
            },
            placeholder: {
                type:String,
                required:false,
                default:undefined
            },
            icon: {
                type:String,
                required:true,
            },
            required: {
                type: Boolean,
                default: false,
            },
            disabled: {
                type: Boolean,
                default: false,
            },
        },

        data(){
            return {
                errorMessage: null,
            }
        },

        computed:{
            value_:{
                get(){
                    return this.value
                },
                set(value){
                    this.$emit("input", value)
                }
            },

            hasError(){
                if(this.required && !this.value)
                    return true

                return false
            }
        },
    }
</script>
