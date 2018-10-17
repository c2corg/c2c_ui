<template>
    <div class="control" :class="{'has-error':hasError}">
        <span v-for="activity of constants.activities" :key="activity"
              :class="{'selected':value_.includes(activity)}"
              class="input-item"
              v-tooltip="$gettext(activity)"
              @click="toggle(activity)">
            <icon-activity :activity="activity" />
        </span>
    </div>
</template>

<script>
    import constants from "@/js/constants.js"

    export default {
        props:{
            value: {
                type:Array,
                default:undefined,
            },
            hasError:{
                type:Boolean,
                default:undefined,
            }
        },

        data(){
            return {
                constants,
            }
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
            toggle(activity){
                let newValue = this.value_.slice(0);

                newValue.toggle(activity)

                if(newValue.length != 0)
                    this.value_ = newValue
            }
        }
    }
</script>

<style scoped lang="scss">

@import '@/assets/sass/variables.scss';

.input-item {
    cursor:pointer;
    font-size:40px;
    margin:4px;
    color:#888;
}
.selected{
    color:$primary;
}
.has-error{
    box-shadow: 0px 0px 8px 0px $danger;
    // border: 1px solid $danger;
}
</style>
