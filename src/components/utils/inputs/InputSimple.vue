<template>

    <div
        class="control"
        :class="{'has-icons-right':postfix, 'has-prefix':prefix, 'is-expanded':isExpanded}">
       <span v-if="prefix" class="button is-static prefix">
           <span class="is-first-letter-uppercase">
               {{ prefix }}
           </span>
       </span>

       <div v-if="options" class="select" :class="{'is-danger':hasError}">
           <select v-model="value_">
               <option v-if="!required"/>
               <option
                   v-for="option of options"
                   :key="option"
                   :value="option">
                   {{ i18n ? $gettext(option) : option }}
               </option>
           </select>
       </div>

        <input
            v-else
            :type="type"
            :min="min"
            :man="max"
            :disabled="disabled"
            :placeholder="placeholder"
            v-model="value_"
            class="input"
            :class="{'is-danger':hasError}">

        <span v-if="postfix" class="icon is-right">
            {{ postfix }}
        </span>
    </div>

</template>

<script>

export default {
    props:{
        type: {
            type: String,
            default: "text"
        },
        min: {
            type: Number,
            default: undefined
        },
        max: {
            type: Number,
            default: undefined
        },
        disabled: {
            type: Boolean,
            default: undefined
        },
        placeholder: {
            type: String,
            default: undefined
        },
        value: {
            type: [String, Number],
            default:undefined
        },
        prefix: {
            type: String,
            default: undefined
        },
        postfix: {
            type: String,
            default: undefined
        },
        options: {
            type: Array,
            default: undefined
        },
        i18n: {
            type: Boolean,
            default: undefined
        },
        required: {
            type: Boolean,
            default: undefined
        },
        isExpanded:{
            type:Boolean,
            default:undefined,
        },
        hasError:{
            type:Boolean,
            default:undefined,
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
    },
}

</script>

<style scoped lang="scss">

select, input {
    min-width:15rem;
}

.has-prefix{
    display:flex;

    .prefix{
        margin-right: -1px;
            border-bottom-right-radius: 0;
            border-top-right-radius: 0;
    }
    input, select{
        border-bottom-left-radius: 0;
        border-top-left-radius: 0;
    }
}

</style>
