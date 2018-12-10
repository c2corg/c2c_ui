<template>
    <marker-gps-trace v-show="params.data.geometry.has_geom_detail" />
</template>

<script>
    import Vue from 'vue'

    export default Vue.extend({ })
</script>
