<template>
  <div class="section-item" v-show="visible">
    <div class="columns is-mobile section-header">
      <div class="column">
        <h2 class="title is-2" :class="{ 'has-text-danger': hasError }">
          {{ title }}
        </h2>
        <p v-if="subTitle">
          <em> {{ subTitle }} </em>
        </p>
      </div>
      <div class="column is-narrow">
        <button class="button is-info" @click="toggleExpandedState">
          {{ expanded_ ? $gettext('Collapse') : $gettext('Expand') }}
        </button>
      </div>
    </div>
    <div ref="content" class="section-content section-content-hidden">
      <slot />
    </div>
    <hr />
  </div>
</template>

<script>
export default {
  props: {
    title: {
      type: String,
      required: true,
    },
    subTitle: {
      type: String,
      default: undefined,
    },
    expandedOnLoad: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      expanded_: false,
      style: null,
      visible: true,
      hasError: false,
    };
  },

  mounted() {
    this.style = document.createElement('style');
    this.style.type = 'text/css';
    document.getElementsByTagName('head')[0].appendChild(this.style);

    for (const child of this.$children) {
      child.$watch('visible', this.checkVisibility);
      child.$watch('hasError', this.checkHasError);
    }

    this.checkVisibility();
    this.checkHasError();

    window.addEventListener('keyup', this.onKeyup);

    if (this.expandedOnLoad) {
      this.toggleExpandedState();
    }
  },

  beforeDestroy() {
    window.removeEventListener('keyup', this.onKeyup);
  },

  methods: {
    toggleExpandedState() {
      const content = this.$refs.content;
      const className = `section-content-expanded${this._uid}`;

      if (!this.expanded_) {
        this.style.innerHTML = `.${className} { max-height: ${content.scrollHeight}px!important; }`;
        content.classList.remove('section-content-hidden');
        content.classList.add(className);
        setTimeout(() => {
          content.classList.remove(className);
        }, 301);
      } else {
        this.style.innerHTML = `.${className} { max-height: ${content.clientHeight}px!important; }`;
        content.classList.add(className);
        setTimeout(() => {
          content.classList.add('section-content-hidden');
          content.classList.remove(className);
        }, 0);
      }

      this.expanded_ = !this.expanded_;
    },

    onKeyup(event) {
      if (event.altKey && event.shiftKey) {
        if ((event.key === 'ArrowUp' && this.expanded_) || (event.key === 'ArrowDown' && !this.expanded_)) {
          this.toggleExpandedState();
        }
      }
    },

    checkVisibility() {
      this.visible = false;

      for (const child of this.$children) {
        if (child.visible) {
          this.visible = true;
          return;
        }
      }
    },

    checkHasError() {
      this.hasError = false;

      for (const child of this.$children) {
        if (child.hasError === true) {
          this.hasError = true;
        }
      }
    },
  },
};
</script>

<style scoped lang="scss">
.section-item {
  .section-header {
    .title {
      margin-bottom: 5px;
    }
  }

  .section-content-hidden {
    overflow: hidden;
    transition: max-height 0.3s;
    max-height: 0;
  }
}
</style>
