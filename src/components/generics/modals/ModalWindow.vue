<template>
  <div class="modal" :class="{ 'is-active': visible, 'is-wide': wide, 'is-small': small }">
    <div class="modal-background" @click="hide" :class="{ 'is-transparent': hasTransparentShader }" />
    <div class="modal-content" :class="{ 'has-background-danger has-text-white-bis': isDanger }">
      <header v-if="$slots.header" class="title is-3">
        <button class="delete is-pulled-right" aria-label="close" @click="hide" v-if="hasCloseButton" />
        <slot name="header" />
      </header>
      <button v-else-if="hasCloseButton" class="delete is-pulled-right" aria-label="close" @click="hide" />
      <slot> Modal content </slot>
      <footer v-if="$slots.footer" class="is-3">
        <slot name="footer"></slot>
      </footer>
    </div>
  </div>
</template>

<script>
import mixins from './mixins';

export default {
  mixins: [mixins],

  props: {
    wide: {
      type: Boolean,
      default: false,
    },
    small: {
      type: Boolean,
      default: false,
    },
    isDanger: {
      type: Boolean,
      default: false,
    },
    hasTransparentShader: {
      type: Boolean,
      default: false,
    },
    hasCloseButton: {
      type: Boolean,
      default: true,
    },
  },
};
</script>

<style scoped>
.modal-content {
  background: white;
  border-radius: 4px;
  padding: 1.5rem;
}

.is-transparent {
  background-color: #00000000;
}

.is-wide .modal-content {
  width: 95%;
  padding: 2%;
}

.is-small .modal-content {
  width: 30rem;
  max-width: 95%;
}

.title {
  border-bottom: 1px solid #e5e5e5;
  padding-bottom: 1.5rem;
}
</style>
