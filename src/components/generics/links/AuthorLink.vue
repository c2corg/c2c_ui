<template>
  <span>
    <router-link :to="{ name: 'profile', params: { id: author.user_id } }">
      {{ author.name }}
    </router-link>
  </span>
</template>

<script setup lang="ts">
defineProps({
  author: {
    type: Object,
    required: true,
  },
});
</script>
