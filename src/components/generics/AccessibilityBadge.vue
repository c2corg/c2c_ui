<template>
  <span class="accessibility-badge" :class="stateClass">
    <fa-icon :icon="stateIcon" aria-hidden="true" />
    {{ label }}
  </span>
</template>

<script>
export default {
  name: 'AccessibilityBadge',

  props: {
    /**
     * The round-trip verification result for this document, or `null` when it has not been verified yet (only matched
     * by the estimated aller/retour/intersection area). Shape: `{ aller: {found}, retour: {found}, compatible }`.
     */
    result: {
      type: Object,
      default: null,
    },
  },

  computed: {
    state() {
      if (!this.result) {
        return 'unverified';
      }

      const allerFound = Boolean(this.result.aller?.found);
      const retourFound = Boolean(this.result.retour?.found);

      if (allerFound && retourFound && this.result.compatible) {
        return 'both';
      }

      if (allerFound && !retourFound) {
        return 'partial-aller';
      }

      if (!allerFound && retourFound) {
        return 'partial-retour';
      }

      return 'none';
    },

    stateClass() {
      return `is-${this.state}`;
    },

    stateIcon() {
      return (
        {
          unverified: 'question-circle',
          both: 'check-circle',
          'partial-aller': 'exclamation-circle',
          'partial-retour': 'exclamation-circle',
          none: 'ban',
        }[this.state] ?? 'question-circle'
      );
    },

    label() {
      switch (this.state) {
        case 'both':
          return this.$gettext('Verified: round trip possible');
        case 'partial-aller':
          return this.$gettext('Verified: outbound only');
        case 'partial-retour':
          return this.$gettext('Verified: return only');
        case 'none':
          return this.$gettext('No compatible trip found');
        default:
          return this.$gettext('Estimated area match');
      }
    },
  },
};
</script>

<style scoped lang="scss">
.accessibility-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: bold;
  white-space: nowrap;
  line-height: 1.4;

  &.is-unverified {
    border: 1px dashed #999;
    color: #666;
    background: transparent;
  }

  &.is-both {
    border: 1px solid #2e7d32;
    background: #e8f5e9;
    color: #2e7d32;
  }

  &.is-partial-aller,
  &.is-partial-retour {
    border: 1px solid #e69500;
    background: #fff3e0;
    color: #b26a00;
  }

  &.is-none {
    border: 1px solid #c62828;
    background: #ffebee;
    color: #c62828;
  }
}
</style>
