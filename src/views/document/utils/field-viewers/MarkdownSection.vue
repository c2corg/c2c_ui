<template>
  <div v-if="(document.cooked[field.name] && field.isVisibleFor(document)) || $slots.after" class="markdown-section">
    <div class="accordion-title" :class="{ 'no-print': !visible }">
      <h2 v-if="field.name != 'summary' && !hideTitle" class="title is-2">
        <span>
          {{ (title || $gettext(field.name)) | uppercaseFirstLetter }}
        </span>
      </h2>
      <fa-icon
        class="is-size-6 has-cursor-pointer no-print accordion-icon"
        icon="angle-down"
        :rotation="visible ? undefined : 180"
        @click="visible = !visible"
      />
    </div>
    <div v-show="visible">
      <div :lang="lang">
        <markdown
          v-if="document.cooked[field.name]"
          :class="{ 'is-italic': field.name === 'summary' }"
          :content="document.cooked[field.name]"
        />
        <slot name="after" />
      </div>
    </div>
  </div>
</template>

<script>
import { requireDocumentProperty, requireFieldProperty } from '@/js/properties-mixins';

export default {
  mixins: [requireDocumentProperty, requireFieldProperty],

  props: {
    hideTitle: {
      type: Boolean,
      default: false,
    },
    title: {
      type: String,
      default: null,
    },
  },

  data() {
    return {
      visible: true,
    };
  },

  computed: {
    lang() {
      const current_lang = this.$language.current;
      const document_lang = this.document ? this.document.cooked.lang : null;
      return document_lang === current_lang ? undefined : this.$language.getIANALanguageSubtag(document_lang);
    },
  },
};
</script>

<style lang="scss" scoped>
.markdown-section {
  .title {
    font-size: 1.8rem !important;
    margin-bottom: 0.5em !important;
    border-bottom: 1px solid #ddd;
  }

  &:nth-last-child(n + 3) {
    margin-bottom: 1.5rem;
  }
}

@media print {
  .markdown-section {
    .title {
      font-size: 1.2rem !important;
      margin-bottom: 0.25em !important;
    }
  }
}

.accordion-title {
  position: relative;
}

.accordion-icon {
  position: absolute;
  top: 0;
  right: 0;
}
</style>
