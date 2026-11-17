<template>
  <div class="column">
    <div class="field">
      <label class="label">
        <span>
          {{ $filters.uppercaseFirstLetter($gettext('quality')) }}
        </span>
        &nbsp;
        <span v-if="!isCollaborative" @click="autoComputeQuality = !autoComputeQuality">
          <fa-icon :icon="autoComputeQuality ? 'lock' : 'unlock'" class="has-cursor-pointer" />
        </span>
      </label>
    </div>
    <div class="field quality-select-container">
      <input-simple
        v-if="autoComputeQuality && !isCollaborative"
        :options="constants.quality_types"
        i18n
        i18n-context="quality_types"
        :model-value="computedQuality"
        disabled
      />
      <input-simple
        v-else
        :options="constants.quality_types"
        i18n
        i18n-context="quality_types"
        required
        v-model="document.quality"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import constants from '@/js/constants';
import { computeQuality } from '@/js/document-quality';
import { documentProperty } from '@/js/properties';

const props = defineProps({ ...documentProperty });

const autoComputeQuality = ref(true);

// in edit mode, there is only one locale
const editedLocale = computed(() => props.document.locales![0]);

const isCollaborative = computed(() => {
  const document = props.document;

  if (['a', 'b', 'w', 'r', 'm'].includes(document.type!)) {
    return true;
  }
  if (['u', 'o', 'x'].includes(document.type!)) {
    return false;
  }
  if (['i'].includes(document.type!)) {
    return document.image_type === 'collaborative';
  }
  if (['c'].includes(document.type!)) {
    return document.article_type === 'collab';
  }

  return false;
});

// "great" is never proposed by the computation: a "great" document was set so, it is kept
const computedQuality = computed(() => computeQuality(props.document, editedLocale.value));

// will be called by parent component before saving document
function beforeSave() {
  if (!isCollaborative.value && autoComputeQuality.value) {
    props.document.quality = computedQuality.value;
  }
}

defineExpose({ beforeSave });
</script>
<style scoped>
.quality-select-container {
  max-width: 20rem;
}
</style>
