<template>
    <span>
        <span v-for="activity of constants.activities" :key="activity"
              @click="toggle(activity)"
              class="input-item"
              :class="{'selected':value_.includes(activity)}">
            <icon-activity :activity="activity" />
        </span>
    </span>
</template>

<script>
    import constants from "@/js/constants.js"

    export default {
        props:["value"],

        data(){
            return {
                constants,
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
            }
        },

        methods:{
            toggle(activity){
                let newValue = this.value_.slice(0);

                newValue.toggle(activity)

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
</style>
