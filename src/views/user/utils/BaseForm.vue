<template>
  <form @submit="submit">
    <slot name="header" />
    <div v-for="(error, i) of serverMetaErrors" :key="i" class="notification is-danger has-text-centered">
      {{ $gettext(error.description, 'API message') }}
    </div>

    <slot />
  </form>
</template>

<script>
import { formContainer } from '@/js/form-registration';

export default {
  // the form fields register themselves (user FormField)
  mixins: [formContainer('baseForm')],

  props: {
    promise: {
      type: Object,
      default: null,
    },
  },

  emits: ['submit'],

  data() {
    return {
      serverMetaErrors: [], // errors that can't be linked to an input
    };
  },

  computed: {
    inputs() {
      return Object.fromEntries(this.formFields.map((field) => [field.name, field]));
    },

    hasError() {
      return this.formFields.some((field) => field.hasError);
    },
  },

  watch: {
    promise: {
      handler: 'computeErrors',
      deep: true,
    },
  },

  methods: {
    cleanErrors() {
      this.serverMetaErrors = [];

      for (const input of Object.values(this.inputs)) {
        input.errorMessage = undefined;
      }
    },

    computeErrors() {
      this.cleanErrors();

      if (!this.promise || !this.promise.error) {
        return;
      }

      const serverErrors = this.promise.error.response.data;

      if (!serverErrors.errors) {
        // unpexted error structure from API
        this.serverMetaErrors.push(serverErrors);
      } else {
        for (const error of serverErrors.errors) {
          if (this.inputs[error.name]) {
            this.inputs[error.name].errorMessage = error.description;
          } else {
            this.serverMetaErrors.push(error);
          }
        }
      }
    },

    submit(event) {
      event.preventDefault();

      if (this.hasError) {
        return;
      }

      for (const input of Object.values(this.inputs)) {
        input.errorMessage = null;
      }

      this.serverMetaErrors = [];

      this.$emit('submit');
    },
  },
};
</script>
