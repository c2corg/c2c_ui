<template>
    <div class="buttons">
        <button
            v-for="option of options"
            :key="option"
            @click="toggle(option)"
            class="button is-primary is-rounded"
            :class="{ 'is-outlined':multiple ? !value_.includes(option) : value !== option }">
            <span class="is-first-letter-uppercase">
                {{ i18n ? $gettext(option) : option }}
            </span>
        </button>
    </div>
</template>

<script>

    export default {
        props:{
            value: {
                type:[Array, String],
                default:null,
            },
            options: {
                type:Array,
                required:true,
            },
            multiple: {
                type:Boolean,
                default:false,
            },
            i18n: {
                type:Boolean,
                default:false,
            },
            required: {
                type:Boolean,
                default:false,
            },
        },

        computed:{
            value_:{
                get(){
                    if(this.multiple)
                        return this.value ? this.value : []
                    else
                        return this.value
                },
                set(value){
                    this.$emit("input", value)
                }
            }
        },

        methods:{
            toggle(value){
                if(this.multiple){
                    let newValue = this.value_.slice(0);

                    newValue.toggle(value)

                    if(newValue.length !== 0 || !this.required)
                        this.value_ =  newValue

                } else {
                    this.value_ = this.value == value ? (this.required ? this.value : null) : value
                }
            }
        }
    }
</script>
