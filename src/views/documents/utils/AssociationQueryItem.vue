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
<style scoped lang="scss">
.input-document {
  @media screen and (min-width: $tablet) {
    margin-right: 1rem;
  }
}
</style>
