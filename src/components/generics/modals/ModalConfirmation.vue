<template>
  <modal-card ref="modal">
    <template #title>
      <div>
        <slot name="title" />
      </div>
    </template>
    <div>
      <div v-if="showUncancelableWarning" class="notification is-warning has-text-centered">
        <strong v-translate>Warning: This action cannot be undone!</strong>
      </div>

      <slot />
    </div>
    <template #footer>
      <div>
        <button
          @click="$emit('confirm')"
          class="button is-danger"
          :class="{ 'is-loading': promise && promise.loading }"
        >
          <slot name="confirm-label">
            <span v-translate>Confirm</span>
          </slot>
        </button>
        <button @click="hide" class="button is-success" :disabled="promise && promise.loading" v-translate>
          Cancel
        </button>
      </div>
    </template>
  </modal-card>
</template>

<script setup lang="ts">
import { useTemplateRef, watch } from 'vue';

import { useGlobalProperties } from '@/js/composables/global-properties';

const props = defineProps({
  showUncancelableWarning: {
    type: Boolean,
    default: false,
  },
  promise: {
    type: Object,
    default: null,
  },
});

defineEmits(['confirm']);

const { $gettext } = useGlobalProperties();
const modalWindow = useTemplateRef<{ show(): void; hide(): void }>('modal');

function show() {
  modalWindow.value!.show();
}

function hide() {
  modalWindow.value!.hide();
}

function onError() {
  if (!props.promise.error) {
    return;
  }

  if (!props.promise.error.response || !props.promise.error.response.data) {
    window.alert('Unexpected error');
  } else if (!props.promise.error.response.data.errors) {
    window.alert(props.promise.error.response.data);
  } else {
    // $gettext('Only document less than 24h old can be deleted', 'API message')
    window.alert($gettext(props.promise.error.response.data.errors[0].description));
  }
}

watch(() => props.promise?.error, onError);

defineExpose({ show, hide });
</script>
