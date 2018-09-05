<template>
    <base-icon :iconClass="'icon-quality-' + quality"/>
</template>

<script>
    export default {
        props: ['quality'],
    }
</script>
