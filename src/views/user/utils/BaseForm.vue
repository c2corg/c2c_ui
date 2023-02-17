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
export default {
  props: {
    promise: {
      type: Object,
      default: null,
    },
  },

  data() {
    return {
      hasError: false,
      inputs: {},
      serverMetaErrors: [], // errors that can't be linked to an input
    };
  },

  watch: {
    promise: {
      handler: 'computeErrors',
      deep: true,
    },
  },

  mounted() {
    for (const child of this.$children) {
      this.inputs[child.name] = child;
      child.$on('input', this.check);
    }
  },

  // TODO test that
  // destroyed() {
  //   for (const child of this.$children) {
  //     child.$off('input', this.check);
  //   }
  // },

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

    check() {
      for (const child of this.$children) {
        if (child.hasError) {
          this.hasError = true;
          return;
        }
      }

      this.hasError = false;
    },

    submit(event) {
      event.preventDefault();

      this.check(); // must recheck, because auto-fill may not fire good events

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
