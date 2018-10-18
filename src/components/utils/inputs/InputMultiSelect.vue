<template>
    <div class="control buttons" :class="{'has-error':hasError}">
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

    import { baseMixin, arrayMixin } from "./mixins.js"

    export default {
        mixins: [ baseMixin, arrayMixin ],

        props:{
            options: {
                type:Array,
                required:true,
            },
        },
    }
</script>


<style scoped lang="scss">

@import '@/assets/sass/variables.scss';

.has-error{
    box-shadow: 0px 0px 8px 0px $danger;
    // border: 1px solid $danger;
}
</style>
