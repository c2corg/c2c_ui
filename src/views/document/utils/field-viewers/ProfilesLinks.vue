<template>
  <span v-if="profiles.length">
    <icon-profile class="is-size-5" />
    <span>&nbsp;</span>
    <document-link
      v-for="profile of profiles"
      :key="profile.document_id"
      :document="profile"
      class="user-link-label"
      uppercase-first-letter />
  </span>
</template>

<script>
  export default {
    props: {
      profiles: {
        type: Array,
        required: true
      }
    }
  };
</script>

<style scoped>

.user-link-label:not(:last-child)::after{
    content:", ";
}

</style>
