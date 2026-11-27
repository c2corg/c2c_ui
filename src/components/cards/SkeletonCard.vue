<template>
  <!-- a grey card the shape of a card of the feed, while the documents load: instead of an empty page for seconds -->
  <div class="card skeleton-card" aria-hidden="true">
    <div class="skeleton-row">
      <span class="skeleton-block skeleton-icon" />
      <span class="skeleton-block skeleton-title" />
    </div>
    <span class="skeleton-block skeleton-image" />
    <span class="skeleton-block skeleton-line" />
    <span class="skeleton-block skeleton-line is-short" />
  </div>
</template>

<script setup lang="ts">
defineOptions({ name: 'SkeletonCard' });
</script>

<style scoped>
.skeleton-card {
  padding: 0.4rem 0.8rem 0.8rem;
}

.skeleton-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0.4rem 0 0.8rem;
}

.skeleton-block {
  display: block;
  border-radius: 4px;
  background: linear-gradient(90deg, #ececec 25%, #f6f6f6 37%, #ececec 63%);
  background-size: 400% 100%;
  animation: skeleton-shimmer 1.4s ease infinite;
}

.skeleton-icon {
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
}

.skeleton-title {
  flex: 1;
  max-width: 70%;
  height: 1rem;
}

.skeleton-image {
  height: 200px;
  margin-bottom: 0.8rem;
}

.skeleton-line {
  height: 0.75rem;
  margin-bottom: 0.5rem;

  &.is-short {
    width: 55%;
  }
}

@keyframes skeleton-shimmer {
  0% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0 50%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .skeleton-block {
    animation: none;
  }
}

/* dark theme of the app */
:global(html[data-theme='dark']) .skeleton-block {
  background: #2c2c2c;
}
</style>
