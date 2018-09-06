<template>
    <span v-if="elevation">
        <base-icon icon-class="fas fa-sort-amount-up"></base-icon>
        {{elevation}}&nbsp;m
    </span>
</template>

<script>

    export default {
        props: ['elevation'],
}

</script>
