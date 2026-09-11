<template>
  <div v-show="visible" class="field is-horizontal">
    <div class="field-label is-normal">
      <label class="label">
        <marker-helper :name="helper" />
        {{ uppercaseFirstLetter(label) }}
      </label>
    </div>
    <div class="field-body">
      <div
        class="field"
        :class="{
          'is-grouped is-grouped-multiline': isGrouped,
          'is-expanded': isExpanded,
          'is-narrow': isNarrow,
        }"
      >
        <slot />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    label: {
      type: String,
      default: '',
    },
    alwaysVisible: {
      type: Boolean,
      default: false,
    },
    isGrouped: {
      type: Boolean,
      default: false,
    },
    isExpanded: {
      type: Boolean,
      default: false,
    },
    isNarrow: {
      type: Boolean,
      default: false,
    },
    helper: {
      type: String,
      default: undefined,
    },
  },

  data() {
    return {
      visible: true,
      hasError: false,
    };
  },

  mounted() {
    for (const child of this.getSlotChildren()) {
      child.$watch('visible', this.checkVisibility);
      child.$watch('hasError', this.checkHasError);
    }

    this.checkVisibility();
    this.checkHasError();
  },

  methods: {
    // Vue 3 removed $children; walk our own default slot's VNodes and keep the ones
    // that resolved to a component instance (skips plain HTML elements, same as $children did).
    getSlotChildren() {
      return (this.$slots.default?.() ?? []).map((vnode) => vnode.component?.proxy).filter(Boolean);
    },

    checkVisibility() {
      this.visible = this.alwaysVisible;

      for (const child of this.getSlotChildren()) {
        if (child.visible) {
          this.visible = this.visible ?? true;
        }
      }
    },
    checkHasError() {
      this.hasError = false;

      for (const child of this.getSlotChildren()) {
        if (child.hasError === true) {
          this.hasError = true;
        }
      }
    },
  },
};
</script>
