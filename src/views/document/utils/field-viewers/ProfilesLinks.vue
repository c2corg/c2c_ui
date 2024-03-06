<template>
  <span v-if="profiles.length">
    <icon-profile class="is-size-5" />
    <document-link
      v-for="profile of profiles"
      :key="profile.document_id"
      :document="profile"
      class="user-link-label"
      :class="profile.categories"
      uppercase-first-letter
    />
  </span>
</template>

<script>
export default {
  props: {
    profiles: {
      type: Array,
      required: true,
    },
  },
};
</script>

<style scoped>
.user-link-label:not(:last-child)::after {
  content: ', ';
}
.mountain_guide {
  color:red;
}
</style>
