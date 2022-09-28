<template>
  <div v-if="(document.cooked[field.name] && field.isVisibleFor(document)) || $slots.after" class="markdown-section">
    <accordion-item>
      <h2 slot="title" v-if="field.name != 'summary' && !hideTitle" class="title is-2">
        <span>
          {{ (title || $gettext(field.name)) | uppercaseFirstLetter }}
        </span>
      </h2>
      <div slot="content" :lang="lang">
        <markdown
          v-if="document.cooked[field.name]"
          :class="{ 'is-italic': field.name === 'summary' }"
          :content="document.cooked[field.name]"
        />
        <slot name="after" />
      </div>
    </accordion-item>
  </div>
</template>

<script>
import AccordionItem from './AccordionItem.vue';

import { requireDocumentProperty, requireFieldProperty } from '@/js/properties-mixins';

export default {
  components: {
    AccordionItem,
  },
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
