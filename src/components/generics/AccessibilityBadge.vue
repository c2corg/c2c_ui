<template>
  <span class="tag accessibility-badge" :class="STATES[state].class">
    <fa-icon :icon="STATES[state].icon" aria-hidden="true" />
    {{ label }}
  </span>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';

import { useGlobalProperties } from '@/js/composables/global-properties';
import type { RoundTripResult } from '@/js/transport-accessibility';

const props = defineProps({
  /**
   * The round-trip check of this document, or null when it has not been checked (only matched by the estimated
   * outbound/return/intersection areas)
   */
  result: {
    type: Object as PropType<RoundTripResult | null>,
    default: null,
  },
  /**
   * The duration of the route is unknown: its accessibility cannot be checked (also the case of a result flagged
   * `duration_unknown` by the API)
   */
  durationUnknown: {
    type: Boolean,
    default: false,
  },
});

const { $gettext } = useGlobalProperties();

type State = 'unverified' | 'duration-unknown' | 'both' | 'partial-aller' | 'partial-retour' | 'none';

const STATES: Record<State, { class: string; icon: string }> = {
  unverified: { class: 'is-unverified', icon: 'question-circle' },
  'duration-unknown': { class: 'is-light', icon: 'question-circle' },
  both: { class: 'is-success is-light', icon: 'check-circle' },
  'partial-aller': { class: 'is-warning is-light', icon: 'exclamation-circle' },
  'partial-retour': { class: 'is-warning is-light', icon: 'exclamation-circle' },
  none: { class: 'is-danger is-light', icon: 'ban' },
};

const state = computed<State>(() => {
  if (props.durationUnknown || props.result?.duration_unknown) {
    return 'duration-unknown';
  }

  if (!props.result) {
    return 'unverified';
  }

  const allerFound = Boolean(props.result.aller?.found);
  const retourFound = Boolean(props.result.retour?.found);

  if (allerFound && retourFound && props.result.compatible) {
    return 'both';
  }

  if (allerFound && !retourFound) {
    return 'partial-aller';
  }

  if (!allerFound && retourFound) {
    return 'partial-retour';
  }

  return 'none';
});

const label = computed(() => {
  switch (state.value) {
    case 'both':
      return $gettext('Verified: round trip possible');
    case 'partial-aller':
      return $gettext('Verified: outbound only');
    case 'partial-retour':
      return $gettext('Verified: return only');
    case 'none':
      return $gettext('No compatible trip found');
    case 'duration-unknown':
      return $gettext('Duration unknown: not verifiable');
    default:
      return $gettext('Estimated area match');
  }
});
</script>

<style scoped>
.accessibility-badge {
  gap: 0.25rem;
  font-weight: bold;

  &.is-unverified {
    border: 1px dashed var(--c2c-grey);
    color: var(--c2c-grey-dark);
    background: transparent;
  }
}
</style>
