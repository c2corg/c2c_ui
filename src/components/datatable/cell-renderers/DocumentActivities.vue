<template>
  <activities class="cell-activities" :activities="params.data.activities" />
</template>

<script>
  import Vue from 'vue';

  export default Vue.extend({ });
</script>

<style lang="scss" scoped>

    @import '@/assets/sass/variables.scss';

    .cell-activities{
        font-size:1.5rem;
        color:$primary;
    }
</style>
