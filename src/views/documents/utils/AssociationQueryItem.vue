<template>
  <input-document
    v-if="documentTypes.length != 0"
    clear-input-on-toggle
    class="input-document"
    :document-type="documentTypes"
    @add="$emit('add', $event)"
    :placeholder="$gettext('Multi-criteria search')"
  />
</template>

<script setup lang="ts">
defineProps({
  documentTypes: {
    type: Array,
    required: true,
  },
});
defineEmits(['add']);
</script>
<style scoped>
@import '@/assets/css/media.css';

.input-document {
  @media screen and (--c2c-min-tablet) {
    margin-right: 1rem;
  }
}
</style>
