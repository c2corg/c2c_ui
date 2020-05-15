<template>
  <div class="modal" :class="{ 'is-active': visible, 'is-wide': wide }">
    <div class="modal-background" @click="hide" />
    <div class="modal-card">
      <header v-if="$slots.title" class="modal-card-head">
        <p class="modal-card-title">
          <slot name="title">Modal title</slot>
        </p>
        <button class="delete" aria-label="close" @click="hide" />
      </header>
      <section class="modal-card-body">
        <slot>
          Modal content
        </slot>
      </section>
      <footer class="modal-card-foot">
        <slot name="footer">footer</slot>
      </footer>
    </div>
  </div>
</template>

<script>
import mixins from './mixins';

export default {
  mixins: [mixins],

  props: {
    wide: {
      type: Boolean,
      default: false,
    },
  },
};
</script>

<style scoped>
.is-wide .modal-card {
  width: 95%;
  padding: 2%;
}
</style>
