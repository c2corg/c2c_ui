<template>
    <span v-if="elevation">
        <fa-icon icon="sort-amount-up"/>
        {{elevation}}&nbsp;m
    </span>
</template>

<script>

    export default {
        props: ['elevation'],
}

</script>
