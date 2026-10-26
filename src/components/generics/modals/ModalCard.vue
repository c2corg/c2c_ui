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
        <slot> Modal content </slot>
      </section>
      <footer class="modal-card-foot">
        <slot name="footer">footer</slot>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useModal } from '@/js/composables/modal';

defineProps({
  wide: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits<{ show: []; hide: [] }>();

const { visible, show, hide } = useModal(emit);

// the parents show and hide it through a template ref
defineExpose({ visible, show, hide });
</script>

<style scoped>
.is-wide .modal-card {
  width: 95%;
  padding: 2%;
}
</style>
