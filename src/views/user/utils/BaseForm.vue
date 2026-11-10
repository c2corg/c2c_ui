<template>
  <form @submit="submit">
    <slot name="header" />
    <div v-for="(error, i) of serverMetaErrors" :key="i" class="notification is-danger has-text-centered">
      {{ $gettext(error.description, 'API message') }}
    </div>

    <slot />
  </form>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { apiErrors } from '@/js/apis/c2c/api-errors';
import type { ApiError } from '@/js/apis/c2c/schemas';
import { type FormFieldState, useFormContainer } from '@/js/composables/form-registration';

const props = defineProps({
  // the request of the form: its errors are shown on their field, or above the form
  promise: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['submit']);

// the form fields register themselves (user FormField)
const { formFields } = useFormContainer('baseForm');

const serverMetaErrors = ref<ApiError[]>([]); // errors that can't be linked to an input

const inputs = computed<Record<string, FormFieldState>>(() =>
  Object.fromEntries(formFields.value.map((field) => [field.name!, field]))
);

const hasError = computed(() => formFields.value.some((field) => field.hasError));

function cleanErrors() {
  serverMetaErrors.value = [];

  for (const input of Object.values(inputs.value)) {
    input.errorMessage = undefined;
  }
}

function computeErrors() {
  cleanErrors();

  if (!props.promise || !props.promise.error) {
    return;
  }

  for (const error of apiErrors(props.promise.error)) {
    const input = error.name ? inputs.value[error.name] : undefined;
    if (input) {
      input.errorMessage = error.description;
    } else {
      serverMetaErrors.value.push(error);
    }
  }
}

watch(() => props.promise, computeErrors, { deep: true });

function submit(event: Event) {
  event.preventDefault();

  if (hasError.value) {
    return;
  }

  for (const input of Object.values(inputs.value)) {
    input.errorMessage = null;
  }

  serverMetaErrors.value = [];

  emit('submit');
}
</script>
