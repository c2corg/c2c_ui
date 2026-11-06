<template>
  <div>
    <router-link :to="to">
      <slot />
    </router-link>
  </div>
</template>

<script setup lang="ts">
defineProps({
  to: {
    type: Object,
    required: true,
  },
});
</script>

<style scoped>
a {
  box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.14);
  height: 100px;
  padding: 5px;
  background-color: rgba(256, 256, 256, 0.85);
  transition: box-shadow 300ms background-color 300ms;
  color: var(--c2c-text);

  /* child positions */
  display: flex;
  flex-direction: column;
  text-align: center;
  justify-content: center;
}

a:hover {
  box-shadow: 2px 3px 4px 0 rgba(0, 0, 0, 0.14);
  background-color: rgba(256, 256, 256, 0.95);
  color: var(--c2c-text);
}

/* the dark theme of the app (src/stores/app-settings.ts, App.vue): dark tiles */
html[data-theme='dark'] a {
  background-color: rgba(42, 42, 42, 0.9);
  color: #e5e5e5;

  &:hover {
    background-color: rgba(53, 53, 53, 0.95);
    color: #fff;
  }
}
</style>
