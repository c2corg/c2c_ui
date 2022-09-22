<template>
  <div v-if="(document.cooked[field.name] && field.isVisibleFor(document)) || $slots.after" class="markdown-section">
    <h2 v-if="field.name != 'summary' && !hideTitle" class="title is-2" :class="{ 'no-print': !visible }">
      <span>
        {{ (title || $gettext(field.name)) | uppercaseFirstLetter }}
      </span>
      <fa-icon
        class="is-size-6 is-pulled-right has-cursor-pointer no-print"
        icon="angle-down"
        :rotation="visible ? undefined : 180"
        @click="visible = !visible"
      />
    </h2>
    <div v-show="visible" :lang="lang">
      <markdown
        v-if="document.cooked[field.name]"
        :class="{ 'is-italic': field.name === 'summary' }"
        :content="document.cooked[field.name]"
      />
      <slot name="after" />
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
</style>
