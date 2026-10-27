<template>
  <div ref="widget" />
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef } from 'vue';

import { loadRecaptcha, type Recaptcha } from '@/js/recaptcha';

// The reCAPTCHA checkbox: emits verify(token) once solved, and expired when the token is no longer valid.
const props = defineProps({
  sitekey: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['verify', 'expired']);

const widget = useTemplateRef<HTMLElement>('widget');
let grecaptcha: Recaptcha | undefined;
let widgetId: number | undefined;
let isDestroyed = false;

onMounted(() => {
  loadRecaptcha().then((loaded) => {
    if (isDestroyed) {
      return;
    }
    grecaptcha = loaded;
    widgetId = grecaptcha.render(widget.value!, {
      sitekey: props.sitekey,
      callback: (token: string) => emit('verify', token),
      'expired-callback': () => emit('expired'),
    });
  });
});

onBeforeUnmount(() => {
  isDestroyed = true;
});

function reset() {
  if (widgetId !== undefined) {
    grecaptcha!.reset(widgetId);
  }
}

// the forms reset it after a failed submit: a token is valid once
defineExpose({ reset });
</script>
