<template>
  <router-link v-show="!$user.isLogged" :to="{ name: 'auth', query: { redirect } }" class="button is-primary">
    <slot>
      <span v-translate>Login</span>
    </slot>
  </router-link>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

// back to the current page once logged
const redirect = computed(() => route.fullPath);
</script>
