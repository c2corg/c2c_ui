<template>
    <div>
        <div class="level is-mobile"> <!--level must be in a single element to remove bottim margin : TODO remove ugly hack -->
            <span class="level-left">
                <span class="level-item query-bound-value">
                    <span v-if="field.i18n">{{ $gettext(value[0]) }}</span>
                    <span v-else>{{ value[0] }}</span>
                    <span v-if="field.unit">&nbsp;{{ field.unit }}</span>
                </span>
            </span>
            <span class="level-item">
                <span class=" query-label">
                    {{ $gettext(field.name) | uppercaseFirstLetter }}
                </span>
            </span>
            <span class="level-right">
                <span class="level-item query-bound-value">
                    <span v-if="field.i18n">{{ $gettext(value[1]) }}</span>
                    <span v-else>{{ value[1] }}</span>
                    <span v-if="field.unit">&nbsp;{{ field.unit }}</span>
                </span>
            </span>
        </div >
    </div>

</template>

<script>
    import { requireFieldProperty } from '@/js/properties-mixins'

    export default{

        mixins: [ requireFieldProperty ],

        props: {
            value: {
                type: Array,
                required: true
            }
        }
    }
</script>

<style scoped>

.query-label{
    font-style:italic;
}

.query-bound-value{
    font-weight:bold;
}

</style>
