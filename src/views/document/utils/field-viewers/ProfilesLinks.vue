<template>
  <span v-if="profiles.length">
    <document-link v-for="profile of profiles" :key="profile.document_id" :document="profile" class="user-link-label"/>
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
