<template>
    <div class="control buttons" :class="{'has-error':hasError}">
        <span
            v-for="option of options"
            :key="option"
            @click="toggle(option)"
            class="multi-select-item"
            :class="{ 'multi-select-item-active': value_.includes(option) }">
            {{ (i18n ? $gettext(option, i18nContext) : option) | uppercaseFirstLetter }}
        </span>

    </div>
</template>

<script>

    import { baseMixin, arrayMixin } from './mixins.js'

    export default {
        mixins: [ baseMixin, arrayMixin ],

        props: {
            options: {
                type: Array,
                required: true
            },
            i18n: {
                type: Boolean,
                default: false
            },
            i18nContext: {
                type: String,
                default: undefined
            }
        }
    }
</script>

<style scoped lang="scss">

    @import '@/assets/sass/variables.scss';

    .has-error{
        box-shadow: 0px 0px 8px 0px $danger;
        // border: 1px solid $danger;
    }

    .multi-select-item{
        max-width: 100%;
        border: 1px solid $primary;
        color: $primary;
        border-radius:20px;
        padding: 0.2rem 0.75em;
        margin-bottom: 0.5rem;
        user-select: None;
        cursor: pointer;

        transition: box-shadow 100ms, background-color 200ms, color 100ms;
    }

    .multi-select-item:hover{
        box-shadow: 0 0 3px 0 $primary;
    }

    .multi-select-item:not(:last-child){
        margin-right: 0.5rem;
    }

    .multi-select-item-active{
        color: white;
        background-color: $primary;
    }

</style>
