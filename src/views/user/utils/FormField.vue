<template>
  <div class="field">
    <label class="label">
      {{ label }}
      <span v-if="required">*</span>

      <!-- $gettext('already used username', 'API message') -->
      <!-- $gettext('Invalid email address', 'API message') -->
      <!-- $gettext('already used email', 'API message') -->
      <!-- $gettext('Shorter than minimum length 3', 'API message') -->
      <!-- $gettext('Longer than maximum length 25', 'API message') -->
      <!-- $gettext('Contain invalid character(s)', 'API message') -->
      <!-- $gettext('First character is invalid', 'API message') -->
      <!-- $gettext('Last character is invalid', 'API message') -->
      <!-- $gettext('Contains consecutive special characters', 'API message') -->
      <!-- $gettext('Ended by confusing suffix', 'API message') -->
      <!-- $gettext('already used forum_username', 'API message') -->
      <!-- $gettext('Password too short', 'API message') -->
      <!-- $gettext('Password must be at least 10 characters long and contain a lowercase letter, an uppercase letter, a digit and a special character', 'API message') -->
      <!-- $gettext('Missing captcha', 'API message') -->
      <!-- $gettext('Required', 'API message') -->
      <!-- $gettext('Login failed', 'API message') -->
      <!-- $gettext('No user with this email', 'API message') -->
      <!-- $gettext('Username cannot be empty or whitespaces', 'API message') -->
      <!-- $gettext('please consult the server logs', 'API message') -->
      <!-- $gettext('Terms of Service need to be accepted', 'API message') -->

      <span class="has-text-danger has-text-weight-bold" v-if="errorMessage">
        {{ $gettext(errorMessage, 'API message') }}
      </span>
    </label>
    <div class="control has-icons-left has-icons-right">
      <input
        :type="unmasked ? 'text' : type"
        :placeholder="placeholder || label"
        :required="required"
        :disabled="disabled"
        :autocorrect="autocorrect"
        :autocapitalize="autocapitalize"
        ref="input"
        v-model="value_"
        class="input"
        :class="{ 'is-danger': hasError || errorMessage }"
      />
      <span v-if="type === 'password'" class="icon is-small is-right is-clickable" @click="onMaskToggle">
        <fa-icon
          :icon="unmasked ? 'eye-slash' : 'eye'"
          :title="$gettext(unmasked ? 'Hide password' : 'Show Password', 'Password prompt')"
        />
      </span>
      <span class="icon is-small is-left">
        <fa-icon :icon="icon" />
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, toRef, useTemplateRef } from 'vue';

import { useFormField } from '@/js/composables/form-registration';

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  modelValue: {
    type: [String, Number, Boolean],
    default: null,
  },
  label: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
    validator: (value: string) => {
      return ['text', 'number', 'checkbox', 'radio', 'email', 'password'].includes(value);
    },
  },
  placeholder: {
    type: String,
    default: null,
  },
  icon: {
    type: String,
    required: true,
  },
  required: {
    type: Boolean,
    default: false,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  autocorrect: {
    type: String,
    default: undefined,
  },
  autocapitalize: {
    type: String,
    default: undefined,
  },
});

const emit = defineEmits(['update:modelValue']);

// set by the BaseForm containing it, from the API errors
const errorMessage = ref<string | null | undefined>(null);
const unmasked = ref(false);

const value_ = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});

const hasError = computed(() => {
  if (props.required && !props.modelValue) {
    return true;
  }

  return false;
});

// registered with the BaseForm containing it
useFormField('baseForm', reactive({ name: toRef(props, 'name'), hasError, errorMessage }));

function onMaskToggle() {
  unmasked.value = !unmasked.value;
}

const input = useTemplateRef<HTMLInputElement>('input');

// the login view focuses the main input of each of its forms
function focus() {
  input.value!.focus();
}

defineExpose({ focus });
</script>
