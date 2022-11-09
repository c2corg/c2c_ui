<template>
  <input-document
    v-if="documentTypes.length != 0"
    clear-input-on-toggle
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
<style scoped lang="scss">
.input-document {
  @media screen and (min-width: $tablet) {
    margin-right: 1rem;
  }
}
</style>
