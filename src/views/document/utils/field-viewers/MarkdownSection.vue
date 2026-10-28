<template>
  <div v-if="(document.cooked[field.name] && field.isVisibleFor(document)) || $slots.after" class="markdown-section">
    <accordion-item v-if="field.name != 'summary'">
      <template v-if="!hideTitle" #title>
        <h2 class="title is-2">
          <span>
            {{ $filters.uppercaseFirstLetter(title || $gettext(field.name)) }}
          </span>
        </h2>
      </template>
      <template #content>
        <div :lang="lang">
          <markdown
            v-if="document.cooked[field.name]"
            :class="{ 'is-italic': field.name === 'summary' }"
            :content="document.cooked[field.name]"
          />
          <slot name="after" />
        </div>
      </template>
    </accordion-item>
    <div v-else :lang="lang">
      <markdown
        v-if="document.cooked[field.name]"
        :class="{ 'is-italic': field.name === 'summary' }"
        :content="document.cooked[field.name]"
      />
      <slot name="after" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { useGlobalProperties } from '@/js/composables/global-properties';
import { documentProperty, fieldProperty } from '@/js/properties';

const props = defineProps({
  ...documentProperty,
  ...fieldProperty,
  hideTitle: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: null,
  },
});

const { $language } = useGlobalProperties();

const lang = computed(() => {
  const current_lang = $language.current;
  const document_lang = props.document ? props.document.cooked.lang : null;
  return document_lang === current_lang ? undefined : $language.getIANALanguageSubtag(document_lang);
});
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
