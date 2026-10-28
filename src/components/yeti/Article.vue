<template>
  <div class="yeti-article" v-if="document">
    <sub-panel-title>{{ title }}</sub-panel-title>
    <markdown-section :document="document" :field="fields.description" hide-title></markdown-section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';

import SubPanelTitle from '@/components/yeti/SubPanelTitle.vue';
import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';
import { useGlobalProperties } from '@/js/composables/global-properties';
import constants from '@/js/constants';
import MarkdownSection from '@/views/document/utils/field-viewers/MarkdownSection.vue';

const props = defineProps({
  article: {
    type: Object,
    required: true,
  },
});

const { $language } = useGlobalProperties();

const promise = ref<{ data?: unknown } | null>(null);

const title = computed(() => props.article.title);
const document = computed(() => promise.value?.data ?? null);
const fields = constants.objectDefinitions.article.fields;

function cookDocument() {
  // get document, and set promise only in then (no FOIT)
  (c2c.article as DocumentService).getCooked(props.article.id, $language.current!).then((result) => {
    promise.value = result;
  });
}

watch(() => $language.current, cookDocument);

onMounted(cookDocument);
</script>

<style scoped lang="scss">
.yeti-article {
  max-width: 1039px;
  margin-top: 1.75em;
}
:deep(h3) {
  margin-top: 2em;
}
:deep(p) {
  margin: 1em 0;
}
:deep(ul) {
  list-style-type: disc;
}
:deep(figure) img {
  max-width: 90%;
  max-height: 500px;
}
.yeti-article--disclaimer :deep(li) {
  margin: 2em 0;
}
</style>
