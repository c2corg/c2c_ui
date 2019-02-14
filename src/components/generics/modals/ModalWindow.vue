<template>
  <div class="modal" :class="{'is-active': visible, 'is-wide': wide}">
    <div class="modal-background" @click="hide" />
    <div class="modal-content">
      <header v-if="$slots.header" class="title is-3">
        <button class="delete is-pulled-right" aria-label="close" @click="hide" />
        <slot name="header"/>
      </header>
      <slot>
        Modal content
      </slot>
    </div>
  </div>
</template>

<script>
  import mixins from './mixins';

  export default {

    mixins: [ mixins ],

    props: {
      wide: {
        type: Boolean,
        default: false
      }
    }
  };

</script>

<style scoped>
    .modal-content{
        background: white;
        border-radius: 6px;
        padding:1.5rem;
    }

    .is-wide .modal-content{
        width:95%;
        padding:2%;
    }

    .title{
        border-bottom:1px solid #e5e5e5;
        padding-bottom:1.5rem;
    }

</style>
