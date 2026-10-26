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
import { formContainer } from '@/js/form-registration';
import { uidMixin } from '@/js/uid';

export default {
  // the fields register themselves (FormField, AssociationsInputRow, MapInputRow)
  mixins: [formContainer('formSection'), uidMixin],

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
      isMounted: false,
    };
  },

  computed: {
    // hidden when none of its fields is visible. Shown until mounted, as the fields register while it renders:
    // a map inside must not initialize in a hidden (0 size) section
    visible() {
      return !this.isMounted || this.formFields.some((field) => field.visible);
    },

    hasError() {
      return this.formFields.some((field) => field.hasError === true);
    },
  },

  mounted() {
    this.isMounted = true;
    this.style = document.createElement('style');
    this.style.type = 'text/css';
    document.getElementsByTagName('head')[0].appendChild(this.style);

    window.addEventListener('keyup', this.onKeyup);

    if (this.expandedOnLoad) {
      this.toggleExpandedState();
    }
  },

  beforeUnmount() {
    window.removeEventListener('keyup', this.onKeyup);
  },

  methods: {
    toggleExpandedState() {
      const content = this.$refs.content;
      const className = `section-content-expanded${this.uid}`;

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
