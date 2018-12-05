<template>
    <span v-if="array">
        <span v-for="(item, i) of array" :key="i">
            <span>{{ i18n ? $gettext(item) : item }}</span><span v-if="i!=array.length-1">, </span>
        </span>
    </span>
</template>

<script>
    export default{
        props: {
            array: {
                type: Array,
                default: null
            },
            i18n: {
                type: Boolean,
                default: true
            }
        }
    }
</script>
