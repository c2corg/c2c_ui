<template>
  <div ref="widget" />
</template>

<script>
import { loadRecaptcha } from '@/js/recaptcha';

// The reCAPTCHA checkbox: emits verify(token) once solved, and expired when the token is no longer valid.
export default {
  props: {
    sitekey: {
      type: String,
      required: true,
    },
  },

  emits: ['verify', 'expired'],

  mounted() {
    loadRecaptcha().then((grecaptcha) => {
      if (this.isDestroyed) {
        return;
      }
      this.grecaptcha = grecaptcha;
      this.widgetId = grecaptcha.render(this.$refs.widget, {
        sitekey: this.sitekey,
        callback: (token) => this.$emit('verify', token),
        'expired-callback': () => this.$emit('expired'),
      });
    });
  },

  beforeUnmount() {
    this.isDestroyed = true;
  },

  methods: {
    reset() {
      if (this.widgetId !== undefined) {
        this.grecaptcha.reset(this.widgetId);
      }
    },
  },
};
</script>
