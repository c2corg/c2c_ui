<template>
  <div class="verify-accessibility-button" @click.stop @mousedown.stop>
    <div v-if="isRoute && !result && !durationUnknown" class="hiking-duration-field">
      <label :for="hikingDurationInputId">{{ $gettext('Hiking duration') }}</label>
      <input
        :id="hikingDurationInputId"
        type="number"
        min="0"
        step="5"
        class="hiking-duration-input"
        v-model.number="hikingDurationMinutes"
      />
      <span>{{ $gettext('min') }}</span>
    </div>

    <button
      type="button"
      class="button is-small"
      :disabled="!canVerify || loading"
      :title="disabledReason"
      @click.stop.prevent="verify"
    >
      <fa-icon v-if="loading" icon="circle-notch" spin aria-hidden="true" />
      <span v-else>{{ $gettext('Check schedules') }}</span>
    </button>

    <p v-if="durationUnknown" class="duration-unknown-message">
      {{
        $gettext(
          'The schedules cannot be checked: the duration of this route is unknown. You can still open the route.'
        )
      }}
    </p>

    <button
      v-if="result && !durationUnknown"
      type="button"
      class="button is-small is-text detail-toggle"
      @click.stop.prevent="expanded = !expanded"
    >
      {{ expanded ? $gettext('Hide details') : $gettext('Show details') }}
    </button>

    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

    <div v-if="result && expanded && !durationUnknown" class="verify-detail">
      <div class="verify-detail-row">
        <strong>{{ $gettext('Outbound') }}</strong>
        <span v-if="result.aller?.found">
          {{ formatResultTime(result.aller.departure) }} &rarr; {{ formatResultTime(result.aller.arrival) }}
        </span>
        <span v-else class="not-found">{{ $gettext('Not found') }}</span>
      </div>
      <div class="verify-detail-row">
        <strong>{{ $gettext('Return') }}</strong>
        <span v-if="result.retour?.found">
          {{ formatResultTime(result.retour.departure) }} &rarr; {{ formatResultTime(result.retour.arrival) }}
        </span>
        <span v-else class="not-found">{{ $gettext('Not found') }}</span>
      </div>
      <div class="verify-detail-row" v-if="margin !== null">
        <strong>{{ $gettext('Time between outbound and return') }}</strong>
        <span>{{ formatJourneyDuration(margin * 60) }}</span>
      </div>
      <div class="verify-detail-row" v-if="isRoute && marginOverHikingDuration !== null">
        <strong>{{ $gettext('Margin over hiking duration') }}</strong>
        <span :class="{ 'not-found': marginOverHikingDuration < 0 }">
          {{ marginOverHikingDuration >= 0 ? '+' : '-'
          }}{{ formatJourneyDuration(Math.abs(marginOverHikingDuration) * 60) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType, ref, useId } from 'vue';

import itinevertService from '@/js/apis/itinevert-service';
import { useGlobalProperties } from '@/js/composables/global-properties';
import planATripUtils from '@/js/plan-a-trip-utils';
import { documentProperty } from '@/js/properties';
import {
  formatResultDateTime,
  isDurationUnknown,
  marginMinutes,
  type RoundTripResult,
} from '@/js/transport-accessibility';
import type { TransportContext } from '@/js/transport-query';

const props = defineProps({
  /** The route or waypoint document to check */
  ...documentProperty,
  /** The transport search of the url, null when there is none */
  transportContext: {
    type: Object as PropType<TransportContext | null>,
    default: null,
  },
});

const emit = defineEmits<{ verified: [result: RoundTripResult] }>();

const { $gettext, $documentUtils } = useGlobalProperties();
const { formatJourneyDuration } = planATripUtils;

const hikingDurationInputId = `verify-accessibility-${useId()}-hiking-duration`;

const documentType = computed(() => $documentUtils.getDocumentType(props.document.type));
const isRoute = computed(() => documentType.value === 'route');

const hikingDurationMinutes = ref<number | null>(
  props.document.calculated_duration
    ? Math.round(Number(props.document.calculated_duration) * 24 * 60)
    : (props.transportContext?.hikingDuration ?? null)
);
const loading = ref(false);
const result = ref<RoundTripResult | null>(null);
const expanded = ref(false);
const errorMessage = ref<string | null>(null);

/** The duration of the route is unknown: its accessibility cannot be checked (the API lists those routes last) */
const durationUnknown = computed(() =>
  isDurationUnknown(props.document as { duration_unknown?: boolean }, result.value)
);

const canVerify = computed(
  () => Boolean(props.transportContext?.fromAddress && props.transportContext?.date) && !durationUnknown.value
);

/** Why the button is disabled (the tooltip), empty when it is not */
const disabledReason = computed(() => {
  if (durationUnknown.value) {
    return $gettext('The duration of this route is unknown: its accessibility cannot be verified');
  }
  return canVerify.value ? '' : $gettext('No transport search context available');
});

const margin = computed(() => marginMinutes(result.value));

const marginOverHikingDuration = computed(() =>
  margin.value === null || !hikingDurationMinutes.value ? null : margin.value - hikingDurationMinutes.value
);

/** A Navitia datetime or a plain "HH:MM[:SS]" string, with the day when it is not the departure */
const formatResultTime = (value?: string) => formatResultDateTime(value, props.transportContext?.date);

async function verify() {
  const context = props.transportContext;
  if (!context || !canVerify.value || loading.value) {
    return;
  }

  loading.value = true;
  errorMessage.value = null;

  try {
    const { data } = await itinevertService.getRoundTripReachable(
      props.document.document_id!,
      isRoute.value ? 'route' : 'waypoint',
      context.date,
      context.minDeparture,
      context.maxReturn,
      context.fromAddress,
      isRoute.value ? hikingDurationMinutes.value || undefined : undefined,
      context.returnDate
    );
    result.value = data;
    expanded.value = true;
    emit('verified', data);
  } catch (error) {
    result.value = null;
    errorMessage.value = $gettext('Unable to check schedules right now.');
    console.warn('Error checking round-trip accessibility:', error);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.verify-accessibility-button {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.375rem;
  font-size: var(--c2c-size-7);
}

.hiking-duration-field {
  display: flex;
  align-items: center;
  gap: 0.25rem;

  label {
    white-space: nowrap;
  }

  .hiking-duration-input {
    width: 3.5rem;
  }
}

.detail-toggle {
  text-decoration: underline;
}

.error-message,
.not-found {
  color: var(--c2c-danger);
}

.error-message,
.duration-unknown-message {
  width: 100%;
}

.duration-unknown-message {
  color: var(--c2c-grey-dark);
  font-style: italic;
}

.verify-detail {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  margin-top: 0.25rem;
  padding: 0.375rem 0.5rem;
  background: var(--c2c-white-ter);
  border-radius: var(--c2c-radius);

  .verify-detail-row {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
  }
}
</style>
