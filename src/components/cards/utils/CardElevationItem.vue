<template>
    <span v-if="elevation">
        <i class="fas fa-sort-amount-up"></i>
        {{elevation}}&nbsp;m
    </span>
</template>

<script>

    export default {
        props: ['elevation'],
}

</script>