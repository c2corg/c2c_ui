<template>
  <div class="topoguide-link-view">
    <router-link :to="to">
      <span class="is-size-2"><component :is="icon" /></span>
      <span class="is-size-4">{{ label | uppercaseFirstLetter }}</span>
    </router-link>
  </div>
</template>

<script>
export default {
  props: {
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
  },
};
</script>

<style scoped lang="scss">
.topoguide-link-view {
  width: 150px;
  height: 150px;

  a {
    box-sizing: border-box;
    width: 130px;
    height: 130px;

    border-radius: 50%;
    border: 2px solid white;

    // vertical and horizontal center
    position: relative;
    top: 8px;
    left: 8px;

    // child positions
    display: flex;
    flex-direction: column;
    text-align: center;
    justify-content: center;

    color: $light;
    background-color: rgba(128, 128, 128, 0.4);

    transition: 0.2s;
  }

  a:hover {
    transform: scale3d(1.05, 1.05, 1);
    background-color: rgba(255, 255, 255, 0.5);
  }
}
</style>
