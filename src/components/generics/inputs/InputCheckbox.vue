<template>

    <div class="control">
        <input class="is-checkradio is-info" type="checkbox" v-model="value_" @change="$emit('change')">
        <label @click="onClick">
            <slot />
        </label>
    </div>

</template>

<script>
    import { baseMixin } from './mixins.js'

    export default {
        mixins: [ baseMixin ],

        props: {
            value: {
                type: Boolean,
                default: null
            }
        },

        methods: {
            onClick() {
                this.value_ = !this.value_
                this.$emit('change')
            }
        }
    }

</script>

<style scoped>
    .control{ /* extension radio has removed padding around inputs */
        padding-top:calc(0.375em - 1px);
        padding-bottom:calc(0.375em - 1px);
    }
</style>
