<template>
  <div class="transport-filter-form">
    <div v-if="!fixedDocumentType" class="form-input">
      <p class="input-label">
        {{ $gettext('You are looking for ____ accessible by public transport') }}
      </p>
      <input-radio-button
        v-model="documentType"
        :options="documentTypeOptions"
        :default-value="documentType"
        :display-vertically="true"
      />
    </div>

    <div class="form-input">
      <p class="input-label" v-translate>What is your starting point?</p>
      <input-address
        :fullwidth="true"
        :placeholder="$gettext('Enter an address')"
        :show-address-propositions="true"
        :default-address="fromAddress"
        @update:props="updateFromAddress"
      ></input-address>
    </div>

    <div class="form-input">
      <p class="input-label" v-translate>What date and time would you like to leave?</p>
      <div class="select-date-container">
        <div class="date-picker-container">
          <label for="transport-date-input">{{ $gettext('Date') }}</label>
          <div class="input-container">
            <input type="date" id="transport-date-input" class="date-input" :min="twoDaysAgo" v-model="date" />
          </div>
        </div>
        <div class="date-picker-container">
          <label for="transport-min-departure-input">{{ $gettext('Departure after') }}</label>
          <div class="input-container">
            <input type="time" id="transport-min-departure-input" class="hour-input" v-model="minDeparture" />
          </div>
        </div>
        <div class="date-picker-container">
          <label for="transport-max-return-input">{{ $gettext('Return before') }}</label>
          <div class="input-container">
            <input type="time" id="transport-max-return-input" class="hour-input" v-model="maxReturn" />
          </div>
        </div>
      </div>
    </div>

    <div class="form-input advanced-section">
      <button type="button" class="advanced-toggle" @click="showAdvanced = !showAdvanced">
        <fa-icon icon="angle-down" :rotation="showAdvanced ? 180 : undefined" aria-hidden="true" />
        {{ $gettext('Advanced options') }}
      </button>
      <div v-if="showAdvanced" class="advanced-fields">
        <div class="advanced-field">
          <label for="transport-max-duration-input">
            {{ $gettext('Maximum one-way transport duration') }}
          </label>
          <span>
            <input
              type="number"
              id="transport-max-duration-input"
              class="advanced-number-input"
              v-model.number="maxDuration"
              :min="minTripDuration"
              :max="maxTripDuration"
              :step="tripDurationIncrement"
            />
            {{ $gettext('minutes') }}
          </span>
        </div>
        <div class="advanced-field" v-if="effectiveDocumentType === 'route'">
          <label for="transport-hiking-duration-input">
            {{ $gettext('Hiking duration budget') }}
          </label>
          <span>
            <input
              type="number"
              id="transport-hiking-duration-input"
              class="advanced-number-input"
              v-model.number="hikingDuration"
              min="0"
              step="10"
            />
            {{ $gettext('minutes') }}
          </span>
        </div>
      </div>
    </div>

    <p class="error-message" v-if="errorMessage">{{ errorMessage }}</p>

    <div class="searchButton">
      <button class="button is-primary" :disabled="!isSearchEnabled || loading" @click="submit">
        <fa-icon class="search-icon" icon="search" aria-hidden="true" />
        {{ $gettext('Search') }}
      </button>
    </div>
  </div>
</template>

<script>
import itinevertService, {
  MIN_TRIP_DURATION,
  MAX_TRIP_DURATION,
  TRIP_DURATION_INCREMENT,
  DEFAULT_TRIP_DURATION,
} from '@/js/apis/itinevert-service';
import navitiaService from '@/js/apis/navitia-service';
import { getPreferences } from '@/js/vue-plugins/local-storage';

/** Shared local storage entry used to pass the transport search context between Itinevert and the Topoguide pages */
const itinevertStorage = getPreferences('itinevert');

export default {
  name: 'TransportFilterForm',

  props: {
    /**
     * 'navigate': resolves the reachable document IDs then navigates to the corresponding Topoguide page. 'patch':
     * resolves the reachable document IDs then patches `reachable_ids` on the current route, in place.
     */
    mode: {
      type: String,
      required: true,
      validator: (value) => ['navigate', 'patch'].includes(value),
    },
    /** When set, hides the route/waypoint choice and always searches for this document type */
    fixedDocumentType: {
      type: String,
      default: null,
      validator: (value) => value === null || ['route', 'waypoint'].includes(value),
    },
  },

  emits: ['loading', 'error', 'applied'],

  data() {
    const now = new Date();
    const storedContext = itinevertStorage.get('context', null);

    return {
      documentType: this.fixedDocumentType ?? 'route',
      documentTypeOptions: [
        { value: 'route', text: this.$gettext('Route') + 's' },
        { value: 'waypoint', text: this.$gettext('Access points') },
      ],
      fromAddress: storedContext?.fromAddress ?? null,
      date: storedContext?.date ?? now.toISOString().slice(0, 10),
      minDeparture: storedContext?.minDeparture ?? '07:30',
      maxReturn: storedContext?.maxReturn ?? '19:00',
      maxDuration: null,
      hikingDuration: storedContext?.hikingDuration ?? null,
      showAdvanced: false,
      loading: false,
      errorMessage: null,
      errorMessages: {
        no_solution: this.$gettext('It seems your trip can not be completed on the selected date and time'),
        unknown_object: this.$gettext(
          "The start and finish points are too far apart to find a route. Choose a start in a city closer to the route's access point."
        ),
        unknown_error: this.$gettext('An unknown error occurred.'),
        navitia_internal_error: this.$gettext('Public transport data is currently unavailable.'),
        auth_error: this.$gettext('Authentication to public transport data service error.'),
        invalid_param: this.$gettext('Invalid parameters were sent to public transport data service.'),
      },
    };
  },

  computed: {
    effectiveDocumentType() {
      return this.fixedDocumentType ?? this.documentType;
    },
    isSearchEnabled() {
      return Boolean(this.fromAddress && this.date && this.minDeparture && this.maxReturn);
    },
    twoDaysAgo() {
      const d = new Date();
      d.setDate(d.getDate() - 2);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    },
    minTripDuration() {
      return MIN_TRIP_DURATION;
    },
    maxTripDuration() {
      return MAX_TRIP_DURATION;
    },
    tripDurationIncrement() {
      return TRIP_DURATION_INCREMENT;
    },
    defaultTripDuration() {
      return DEFAULT_TRIP_DURATION;
    },
  },

  methods: {
    updateFromAddress(address) {
      this.fromAddress = address;
    },

    async submit() {
      if (!this.isSearchEnabled || this.loading) {
        return;
      }

      this.errorMessage = null;
      this.loading = true;
      this.$emit('loading', true);

      let response;
      try {
        response = await itinevertService.getReachableDocumentIds(
          {},
          this.date,
          this.minDeparture,
          this.maxReturn,
          this.fromAddress,
          this.effectiveDocumentType,
          this.maxDuration || undefined,
          this.effectiveDocumentType === 'route' ? this.hikingDuration || undefined : undefined
        );
      } catch (error) {
        this.errorMessage = this.formatError(error);
        this.$emit('error', error);
        this.loading = false;
        this.$emit('loading', false);
        return;
      }

      const data = response.data;

      const context = {
        fromAddress: this.fromAddress,
        date: this.date,
        minDeparture: this.minDeparture,
        maxReturn: this.maxReturn,
        hikingDuration: this.hikingDuration || null,
        allerGeom: data.aller_geom || null,
        retourGeom: data.retour_geom || null,
        intersectionGeom: data.intersection_geom || null,
      };
      itinevertStorage.set('context', context);

      const ids = data.document_ids ?? [];
      const query = { reachable_ids: ids.join(',') };

      if (this.mode === 'navigate') {
        this.$router.push({ name: this.effectiveDocumentType + 's', query });
      } else {
        this.$router.push({ query: { ...this.$route.query, ...query } });
      }

      this.loading = false;
      this.$emit('loading', false);
      this.$emit('applied', { documentType: this.effectiveDocumentType, ids, context });
    },

    formatError(error) {
      const rawData = error?.response?.data?.errors?.[0]?.description ?? error?.response?.data ?? error?.message;
      const parsed = navitiaService.handleQueryError(rawData);
      const id = typeof parsed === 'string' ? parsed : parsed?.id ?? parsed?.message;
      return this.errorMessages[id] || this.errorMessages.unknown_error;
    },
  },
};
</script>

<style scoped lang="scss">
.transport-filter-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-input {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: flex-start;

  p {
    font-weight: bold;
  }
}

.select-date-container {
  width: 100%;
  display: flex;
  gap: 15px;
  flex-wrap: wrap;

  .date-picker-container {
    align-self: flex-end;
    width: 100%;
    max-width: 150px;
    position: relative;

    label {
      position: absolute;
      font-size: 12px;
      color: #333;
      padding-left: 5px;
      padding-right: 5px;
      left: 0px;
      background-color: white;
      z-index: 1;
      margin-left: 20px;
      margin-top: -10px;
    }

    .input-container {
      position: relative;
      width: 100%;
      border: 1px solid #ccc;
      border-radius: 10px;
      overflow: hidden;
      display: flex;

      .date-input,
      .hour-input {
        flex: 1;
        padding: 11px 13px;
        border: none;
        outline: none;
        font-size: 15px;
        color: #333;
        background-color: white;
      }
    }
  }
}

.advanced-section {
  .advanced-toggle {
    background: none;
    border: none;
    padding: 0;
    font-weight: bold;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    color: $color-base-c2c;
  }

  .advanced-fields {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 12px;

    .advanced-field {
      display: flex;
      flex-direction: column;
      gap: 6px;

      label {
        font-weight: normal;
      }

      .advanced-number-input {
        width: 70px;
        margin-right: 8px;
      }
    }
  }
}

.error-message {
  color: #ff3262;
  font-weight: bold;
}

.searchButton {
  display: flex;
  font-weight: bold;
  align-items: center;
  gap: 16px;

  .search-icon {
    padding-right: 1rem;
  }
}
</style>
