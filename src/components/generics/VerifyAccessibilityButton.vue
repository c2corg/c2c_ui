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
      class="button is-small is-outlined verify-button"
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
      <div class="verify-detail-row" v-if="marginMinutes !== null">
        <strong>{{ $gettext('Time between outbound and return') }}</strong>
        <span>{{ formatJourneyDuration(marginMinutes * 60) }}</span>
      </div>
      <div class="verify-detail-row" v-if="isRoute && marginOverHikingDuration !== null">
        <strong>{{ $gettext('Margin over hiking duration') }}</strong>
        <span :class="{ 'margin-negative': marginOverHikingDuration < 0 }">
          {{ marginOverHikingDuration >= 0 ? '+' : '-'
          }}{{ formatJourneyDuration(Math.abs(marginOverHikingDuration) * 60) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script>
import itinevertService from '@/js/apis/itinevert-service';
import planATripUtils from '@/js/plan-a-trip-utils';
import { formatResultDateTime, isDurationUnknown, marginMinutes } from '@/js/transport-accessibility';

let uid = 0;

export default {
  name: 'VerifyAccessibilityButton',

  props: {
    /** The route or waypoint document to verify */
    document: {
      type: Object,
      required: true,
    },
    /**
     * The active transport search context: `{ fromAddress, date, returnDate, minDeparture, maxReturn, hikingDuration
     * }`, as read from the url. `null` when no transport search is active.
     */
    transportContext: {
      type: Object,
      default: null,
    },
  },

  emits: ['verified'],

  data() {
    return {
      uid: `verify-accessibility-${uid++}`,
      hikingDurationMinutes: this.computeDefaultHikingDuration(),
      loading: false,
      result: null,
      expanded: false,
      errorMessage: null,
    };
  },

  computed: {
    documentType() {
      return this.$documentUtils.getDocumentType(this.document.type);
    },

    isRoute() {
      return this.documentType === 'route';
    },

    /** The duration of the route is unknown: its accessibility cannot be verified (the API lists those routes last) */
    durationUnknown() {
      return isDurationUnknown(this.document, this.result);
    },

    canVerify() {
      return Boolean(this.transportContext?.fromAddress && this.transportContext?.date) && !this.durationUnknown;
    },

    /** Why the button is disabled (the tooltip), empty when it is not */
    disabledReason() {
      if (this.durationUnknown) {
        return this.$gettext('The duration of this route is unknown: its accessibility cannot be verified');
      }
      return this.canVerify ? '' : this.$gettext('No transport search context available');
    },

    hikingDurationInputId() {
      return `${this.uid}-hiking-duration`;
    },

    marginMinutes() {
      return marginMinutes(this.result);
    },

    marginOverHikingDuration() {
      if (this.marginMinutes === null || !this.hikingDurationMinutes) {
        return null;
      }
      return this.marginMinutes - this.hikingDurationMinutes;
    },
  },

  methods: {
    // Expose plan-a-trip's formatting helpers (formatTime, formatJourneyDuration, ...) to the template
    ...planATripUtils,

    computeDefaultHikingDuration() {
      if (this.document?.calculated_duration) {
        return Math.round(this.document.calculated_duration * 24 * 60);
      }
      return this.transportContext?.hikingDuration ?? null;
    },

    /** Formats a Navitia datetime or a plain "HH:MM[:SS]" string for display, with the day when it is not the departure */
    formatResultTime(value) {
      return formatResultDateTime(value, this.transportContext?.date);
    },

    async verify() {
      if (!this.canVerify || this.loading) {
        return;
      }

      this.loading = true;
      this.errorMessage = null;

      try {
        const { data } = await itinevertService.getRoundTripReachable(
          this.document.document_id,
          this.documentType,
          this.transportContext.date,
          this.transportContext.minDeparture,
          this.transportContext.maxReturn,
          this.transportContext.fromAddress,
          this.isRoute ? this.hikingDurationMinutes || undefined : undefined,
          this.transportContext.returnDate
        );
        this.result = data;
        this.expanded = true;
        this.$emit('verified', data);
      } catch (error) {
        this.result = null;
        this.errorMessage = this.$gettext('Unable to check schedules right now.');
        console.warn('Error checking round-trip accessibility:', error);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped lang="scss">
.verify-accessibility-button {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
}

.hiking-duration-field {
  display: flex;
  align-items: center;
  gap: 4px;

  label {
    white-space: nowrap;
  }

  .hiking-duration-input {
    width: 55px;
  }
}

.detail-toggle {
  text-decoration: underline;
}

.error-message {
  color: #c62828;
  width: 100%;
}

.duration-unknown-message {
  width: 100%;
  color: #666;
  font-style: italic;
}

.verify-detail {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 4px;
  padding: 6px 8px;
  background: #f5f5f5;
  border-radius: 6px;

  .verify-detail-row {
    display: flex;
    justify-content: space-between;
    gap: 8px;

    .not-found {
      color: #c62828;
    }

    .margin-negative {
      color: #c62828;
    }
  }
}
</style>
