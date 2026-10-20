<template>
  <!--Can't use component for router-link, it does not set the href attribute.
    Surprisingly, it open the link, but it prevents user to open it in a new tab -->
  <router-link v-if="to" :to="to" class="toolbox-button" :rel="rel">
    <span class="toolbox-button-icon">
      <slot name="icon">
        <fa-icon v-if="icon" :icon="icon" fixed-width :class="iconClass" />
      </slot>
    </span>
    <span>
      {{ $filters.uppercaseFirstLetter(label) }}
    </span>
  </router-link>
  <component v-else :is="href ? 'a' : 'div'" @click="$emit('click')" :href="href" class="toolbox-button">
    <span class="toolbox-button-icon">
      <slot name="icon">
        <fa-icon v-if="icon" :icon="icon" fixed-width :class="iconClass" />
      </slot>
    </span>
    <span>
      {{ $filters.uppercaseFirstLetter(label) }}
    </span>
  </component>
</template>

<script>
export default {
  props: {
    icon: {
      type: [String, Array],
      default: null,
    },
    iconClass: {
      type: String,
      default: null,
    },
    label: {
      type: String,
      required: true,
    },
    href: {
      type: String,
      default: null,
    },
    rel: {
      type: String,
      default: null,
    },
    to: {
      type: Object,
      default: null,
    },
  },

  emits: ['click'],
};
</script>

<style scoped lang="scss">
.toolbox-button {
  display: block;
  cursor: pointer;

  span {
    color: $link;
  }

  :hover {
    color: $text;
  }

  .toolbox-button-icon {
    width: 1rem;
    color: $text;
  }
}
</style>
