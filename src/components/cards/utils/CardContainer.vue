<template>
  <div class="card" :class="{'is-highlighted': highlighted}">
    <component :is="document ? 'document-link' : 'span'" :document="document">
      <slot />
    </component>
  </div>
</template>

<script>

  export default {
    props: {
      document: {
        type: Object,
        default: null
      },

      highlighted: {
        type: Boolean,
        default: false
      }
    }
  };
</script>

<style scoped lang="scss">

  @import '@/assets/sass/variables.scss';

  .card{
    transition:0.1s;
    border: $card-border;
    background: white;
  }

  .card:hover, .is-highlighted{
    transition:0.2s;
    box-shadow: $card-hover-shadow;
    background: $hover-background;
  }

</style>
