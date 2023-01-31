<template>
  <div>
    <router-link :to="to">
      <slot />
    </router-link>
  </div>
</template>

<script>
export default {
  props: {
    to: {
      type: Object,
      required: true,
    },
  },
};
</script>

<style scoped lang="scss">
a {
  box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.14);
  height: 100px;
  padding: 5px;
  background-color: rgba(256, 256, 256, 0.85);
  transition: box-shadow 300ms background-color 300ms;
  color: $text;

  // child positions
  display: flex;
  flex-direction: column;
  text-align: center;
  justify-content: center;
}

a:hover {
  box-shadow: 2px 3px 4px 0 rgba(0, 0, 0, 0.14);
  background-color: rgba(256, 256, 256, 0.95);
  color: $text;
}
</style>
