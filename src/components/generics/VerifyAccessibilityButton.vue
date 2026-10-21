<template>
  <div class="verify-accessibility-button" @click.stop @mousedown.stop>
    <div v-if="isRoute && !result" class="hiking-duration-field">
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
      :title="!canVerify ? $gettext('No transport search context available') : ''"
      @click.stop.prevent="verify"
    >
      <fa-icon v-if="loading" icon="circle-notch" spin aria-hidden="true" />
      <span v-else>{{ $gettext('Check schedules') }}</span>
    </button>

    <button
      v-if="result"
      type="button"
      class="button is-small is-text detail-toggle"
      @click.stop.prevent="expanded = !expanded"
    >
      {{ expanded ? $gettext('Hide details') : $gettext('Show details') }}
    </button>

    <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>

    <div v-if="result && expanded" class="verify-detail">
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
     * The active transport search context: `{ fromAddress, date, minDeparture, maxReturn, hikingDuration }`, as stashed
     * in local storage by TransportFilterForm. `null` when no transport search is active.
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

    canVerify() {
      return Boolean(this.transportContext?.fromAddress && this.transportContext?.date);
    },

    hikingDurationInputId() {
      return `${this.uid}-hiking-duration`;
    },

    marginMinutes() {
      if (!this.result?.aller?.found || !this.result?.retour?.found) {
        return null;
      }
      const allerArrival = this.toMinutes(this.result.aller.arrival);
      const retourDeparture = this.toMinutes(this.result.retour.departure);
      if (allerArrival === null || retourDeparture === null) {
        return null;
      }
      let diff = retourDeparture - allerArrival;
      if (diff < 0) diff += 24 * 60; // handles a return that crosses midnight
      return diff;
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

    /**
     * Converts either a full Navitia datetime ("YYYYMMDDTHHMMSS") or a plain "HH:MM[:SS]" string to minutes past
     * midnight
     */
    toMinutes(value) {
      if (!value) return null;
      const digits = value.includes('T') ? value.slice(9, 13) : value.replace(/:/g, '').slice(0, 4);
      if (digits.length < 4) return null;
      const hours = parseInt(digits.slice(0, 2), 10);
      const minutes = parseInt(digits.slice(2, 4), 10);
      if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
      return hours * 60 + minutes;
    },

    /** Formats either a full Navitia datetime or a plain "HH:MM[:SS]" string down to "HH:MM" for display */
    formatResultTime(value) {
      if (!value) return '';
      if (value.includes('T')) {
        return this.formatTime(value);
      }
      return value.slice(0, 5);
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
          this.isRoute ? this.hikingDurationMinutes || undefined : undefined
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
