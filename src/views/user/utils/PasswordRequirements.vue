<template>
  <ul class="password-requirements is-size-7 mb-4" aria-live="polite">
    <li class="is-italic" v-translate>Your password must contain:</li>
    <li v-for="rule of rules" :key="rule.key" :class="{ 'has-text-success': rule.ok, 'has-text-grey': !rule.ok }">
      <fa-icon :icon="rule.ok ? 'check' : ['far', 'circle']" fixed-width />
      {{ rule.label }}
      <span class="is-sr-only">{{ rule.ok ? $gettext('requirement met') : $gettext('requirement not met') }}</span>
    </li>
  </ul>
</template>

<script>
import checkPasswordRules from '@/js/password-rules';

export default {
  props: {
    password: {
      type: String,
      default: '',
    },
  },

  computed: {
    rules() {
      const checks = checkPasswordRules(this.password);

      return [
        // literal string (not built from MINIMUM_PASSWORD_LENGTH) so it can be extracted for translation
        { key: 'length', ok: checks.length, label: this.$gettext('At least 10 characters') },
        { key: 'lower', ok: checks.lower, label: this.$gettext('A lowercase letter') },
        { key: 'upper', ok: checks.upper, label: this.$gettext('An uppercase letter') },
        { key: 'digit', ok: checks.digit, label: this.$gettext('A digit') },
        { key: 'special', ok: checks.special, label: this.$gettext('A special character (e.g. ! ? - _ @ #)') },
      ];
    },
  },
};
</script>

<style scoped lang="scss">
.password-requirements {
  li {
    transition: color 0.15s;
  }
}
</style>
