<template>
  <modal-window ref="modal" small has-transparent-shader is-danger>
    <ul>
      <li v-for="(message, i) of messages" :key="i">
        {{ message }}
      </li>
    </ul>
  </modal-window>
</template>

<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';

const messages = ref<string[] | null>(null);
const modal = useTemplateRef<{ show(): void }>('modal');

function show(newMessages: string[]) {
  messages.value = newMessages;
  modal.value!.show();
}

defineExpose({ show });
</script>
