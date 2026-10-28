<template>
  <div ref="root" class="yeti-toast">
    <h2 class="title is-6"><slot name="title" /></h2>
    <p><slot /></p>
  </div>
</template>

<script setup lang="ts">
import { toast as bulmaToast } from 'bulma-toast';
import { useTemplateRef } from 'vue';

const root = useTemplateRef<HTMLElement>('root');

function toast(options?: object) {
  bulmaToast({
    duration: 3000,
    type: 'is-info',
    pauseOnHover: true,
    position: 'center',
    dismissible: true,
    single: true,
    ...options,
    // the content of the toast: this component
    message: root.value!,
  });
}

// the layer buttons show it when they are disabled
defineExpose({ toast });
</script>

<style scoped>
.yeti-toast {
  display: none;
  white-space: normal;
}
.notification .yeti-toast {
  display: block;
}
</style>
