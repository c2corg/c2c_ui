<template>
  <modal-card ref="modal">
    <template #title>
      <div v-translate>Insert a link</div>
    </template>
    <div class="field">
      <label class="label">
        {{ $filters.uppercaseFirstLetter($gettext('text to display')) }}
      </label>
      <div class="control">
        <input class="input" v-model="chunk" />
      </div>
    </div>
    <div class="field">
      <label class="label">
        {{ $filters.uppercaseFirstLetter($gettext('URL')) }}
      </label>
      <div class="control">
        <input class="input" v-model="url" />
      </div>
    </div>
    <template #footer>
      <div class="buttons">
        <button class="button is-success" @click="insert" v-translate>Insert link</button>
        <button class="button is-danger" @click="hide" v-translate>Cancel</button>
      </div>
    </template>
  </modal-card>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';

import { useGlobalProperties } from '@/js/composables/global-properties';

const emit = defineEmits(['insert']);

const { $gettext } = useGlobalProperties();

const chunk = ref('');
const url = ref('');
const modal = useTemplateRef<{ show(): void; hide(): void }>('modal');

function show(newChunk?: string | null, newUrl?: string | null) {
  chunk.value = newChunk ?? $gettext('text to display');
  url.value = newUrl ?? 'https:\\\\';
  modal.value!.show();
}

function hide() {
  modal.value!.hide();
}

function insert() {
  emit('insert', chunk.value, url.value);
  hide();
}

defineExpose({ show });
</script>
