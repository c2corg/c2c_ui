<template>
  <div>
    <div class="accordion-title" :class="{ 'no-print': !visible }">
      <slot name="title" />
      <fa-icon
        class="is-size-6 has-cursor-pointer no-print accordion-icon"
        icon="angle-down"
        :rotation="visible ? undefined : 180"
        @click="visible = !visible"
      />
    </div>
    <div v-show="visible">
      <slot name="content" />
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      visible: true,
    };
  },
};
</script>

<style lang="scss" scoped>
.accordion-title {
  position: relative;
}

.accordion-icon {
  position: absolute;
  top: 0;
  right: 0;
}
</style>
