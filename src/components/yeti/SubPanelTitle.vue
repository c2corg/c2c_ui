<template>
  <div class="columns is-mobile">
    <div class="column">
      <h2 class="title is-6">
        <slot></slot>
      </h2>
    </div>
  </div>
</template>

<style scoped>
h2 {
  display: inline-block;
  margin-left: -1.25rem;
  padding: 0.25em 0.5rem;
  background: var(--c2c-grey-lighter);
  text-transform: uppercase;
}

/* the dark theme of the app (src/stores/app-settings.ts, App.vue): a dark label */
html[data-theme='dark'] h2 {
  background: #3a3a3a;
  color: #f0f0f0;
}
</style>
