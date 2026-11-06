<template>
  <div class="topoguide-link-view">
    <router-link :to="to">
      <span class="is-size-2"><component :is="icon" /></span>
      <span class="is-size-4">{{ $filters.uppercaseFirstLetter(label) }}</span>
    </router-link>
  </div>
</template>

<script setup lang="ts">
defineProps({
  to: {
    type: String,
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    required: true,
  },
});
</script>

<style scoped>
.topoguide-link-view {
  width: 150px;
  height: 150px;

  a {
    box-sizing: border-box;
    width: 130px;
    height: 130px;

    border-radius: 50%;
    border: 2px solid white;

    /* vertical and horizontal center */
    position: relative;
    top: 8px;
    left: 8px;

    /* child positions */
    display: flex;
    flex-direction: column;
    text-align: center;
    justify-content: center;

    color: var(--c2c-light);
    background-color: rgba(128, 128, 128, 0.4);

    transition: 0.2s;
  }

  a:hover {
    transform: scale3d(1.05, 1.05, 1);
    background-color: rgba(255, 255, 255, 0.5);
  }

  /* phone: three bubbles per row, smaller icon and label */
  @media (max-width: 768px) {
    width: min(110px, 32vw);
    height: min(110px, 32vw);

    a {
      width: calc(100% - 10px);
      height: calc(100% - 10px);
      top: 5px;
      left: 5px;
      padding: 0 6px;
    }

    .is-size-2 {
      font-size: 1.75rem !important;
    }

    .is-size-4 {
      font-size: 0.85rem !important;
      line-height: 1.15;
    }
  }
}
</style>
