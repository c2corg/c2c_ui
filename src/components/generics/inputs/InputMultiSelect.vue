<template>
    <div class="control buttons" :class="{'has-error':hasError}">
        <button
            v-for="option of options"
            :key="option"
            @click="toggle(option)"
            class="button is-primary is-rounded"
            :class="{ 'is-outlined': !value_.includes(option) }">
            {{ (i18n ? $gettext(option) : option) | uppercaseFirstLetter }}
        </button>
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

    button{
        max-width: 100%;
    }

    span{
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .button.is-outlined:focus,
    .button.is-outlined:hover {
        background-color: transparent;
        border-color: $primary;
        color: $primary;
    }

</style>
