<template>
  <input-document
    class="input-document"
    :document-type="documentTypes"
    @add="$emit('add', arguments[0])"
    :placeholder="$gettext('Multi-criteria search')"
  />
</template>

<script>
export default {
  props: {
    documentTypes: {
      type: Array,
      required: true,
    },
  },
};
</script>
<style scoped>
.input-document {
  margin-right: 1rem;
}
</style>
