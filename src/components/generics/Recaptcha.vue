<template>
  <div ref="container"></div>
</template>

<script>
// Replaces the Vue2-only `vue-recaptcha` package with a thin wrapper around the reCAPTCHA
// v2 script, which the caller loads itself (see LoginView.vue's `mounted()`), requested with
// `render=explicit&onload=vueRecaptchaApiLoaded`.
export default {
  props: {
    sitekey: {
      type: String,
      required: true,
    },
  },

  data() {
    return {
      widgetId: null,
    };
  },

  mounted() {
    this.renderWidget();
  },

  methods: {
    renderWidget() {
      if (window.grecaptcha?.render) {
        this.widgetId = window.grecaptcha.render(this.$refs.container, {
          sitekey: this.sitekey,
          callback: (token) => this.$emit('verify', token),
          'expired-callback': () => this.$emit('expired'),
        });
      } else {
        // the reCAPTCHA script isn't ready yet; it will call this global once it is.
        window.vueRecaptchaApiLoaded = () => this.renderWidget();
      }
    },

    reset() {
      if (this.widgetId !== null && window.grecaptcha?.reset) {
        window.grecaptcha.reset(this.widgetId);
      }
    },
  },
};
</script>
