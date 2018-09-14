<template>
    <span v-if="elevation" class="is-nowrap">
        <fa-icon icon="sort-amount-up" class="has-text-primary"/>
        {{ elevation }}&nbsp;m
    </span>
</template>

<script>

    export default {
        props: {
            elevation:{
                type:Number,
                default:null,
            }
        },
    }

</script>
