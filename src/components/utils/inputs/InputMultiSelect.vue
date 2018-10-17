<template>
    <div class="control buttons">
        <button
            v-for="option of options"
            :key="option"
            @click="toggle(option)"
            class="button is-primary is-rounded"
            :class="{ 'is-outlined': !value_.includes(option) }">
            <span class="is-first-letter-uppercase">
                {{ i18n ? $gettext(option) : option }}
            </span>
        </button>

        <!-- <div
            class="field"
            v-for="option of options"
            :key="option"
            @click="toggle(option)">
            <input
                class="is-checkradio is-block is-success is-medium"
                :id="option + 'exampleCheckboxBlockDefault'"
                type="checkbox"
                :checked="value_.includes(option)">
            <label
                :for="option + 'exampleCheckboxBlockDefault'"
                class="is-first-letter-uppercase">
                {{ i18n ? $gettext(option) : option }}
            </label>
        </div> -->

    </div>
</template>

<script>

    export default {
        props:{
            value: {
                type:Array,
                default:null,
            },
            options: {
                type:Array,
                required:true,
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
                    return this.value ? this.value : []
                },
                set(value){
                    this.$emit("input", value)
                }
            }
        },

        methods:{
            toggle(value){
                let newValue = this.value_.slice(0);

                newValue.toggle(value)

                if(newValue.length !== 0 || !this.required)
                    this.value_ =  newValue
            }
        }
    }
</script>
