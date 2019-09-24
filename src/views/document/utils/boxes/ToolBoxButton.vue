<template>
  <component
    :is="to ? 'router-link' : (href ? 'a' : 'div')"
    :to="to"
    @click="$emit('click')"
    :href="href"
    class="toolbox-button">
    <span class="toolbox-button-icon">
      <slot name="icon">
        <fa-icon :icon="icon" :class="iconClass" />
      </slot>
    </span>
    <span>
      {{ label | uppercaseFirstLetter }}
    </span>
  </component>
</template>

<script>
  export default {
    props: {
      icon: {
        type: [String, Array],
        required: true
      },
      iconClass: {
        type: String,
        default: null
      },
      label: {
        type: String,
        required: true
      },
      href: {
        type: String,
        default: null
      },
      to: {
        type: Object,
        default: null
      }
    }
  };
</script>

<style scoped lang="scss">
  @import "@/assets/sass/variables.scss";

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
