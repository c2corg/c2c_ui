<template>
  <fa-layers class="fa-lg" @click="visible ? $emit('click', $event) : undefined" :class="{ 'hidden-button': !visible }">
    <fa-icon icon="circle" />
    <fa-icon :icon="['far', 'trash-alt']" transform="shrink-6" :style="{ color: 'white' }" />
  </fa-layers>
</template>

<script>
export default {
  props: {
    visible: {
      type: Boolean,
      default: true,
    },
  },
};
</script>

<style scoped lang="scss">
@import '~bulma/sass/utilities/initial-variables.sass';

.fa-layers:hover {
  filter: brightness(90%);
}

div {
  cursor: pointer;
  color: $red;
  transition: 300ms;

  svg {
    transition: 300ms;
  }
}

.hidden-button {
  width: 0;
  height: 0;
  svg {
    font-size: 0;
  }
}
</style>
