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
        v-if="addressReady"
        :key="addressKey"
        :fullwidth="true"
        :placeholder="$gettext('Enter an address')"
        :show-address-propositions="true"
        :default-address="fromAddress"
        @update:props="updateFromAddress"
      ></input-address>
      <ul v-if="otherRecentAddresses.length" class="recent-addresses">
        <li v-for="address in otherRecentAddresses" :key="addressLabel(address)">
          <button type="button" class="button is-small is-light" @click="selectRecentAddress(address)">
            {{ addressLabel(address) }}
          </button>
        </li>
      </ul>
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
import photon from '@/js/apis/photon';
import {
  addRecentAddress,
  buildTransportQuery,
  formatTransportFrom,
  parseTransportFrom,
  parseTransportQuery,
  transportSearchKey,
  withoutTransportQuery,
} from '@/js/transport-query';
import { getPreferences } from '@/js/vue-plugins/local-storage';

/**
 * Shared local storage entry remembering the last values of the form (`context`) and the starting points already used
 * (`recentAddresses`), so that they are not typed again
 */
const itinevertStorage = getPreferences('itinevert');

const today = () => new Date().toISOString().slice(0, 10);

export default {
  name: 'TransportFilterForm',

  props: {
    /**
     * 'navigate': checks the search then navigates to the corresponding Topoguide page. 'patch': patches the
     * `transport_*` parameters on the current route, in place.
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
    const storedContext = itinevertStorage.get('context', null);
    const recentAddresses = itinevertStorage.get('recentAddresses', []);
    // the search of the url (a shared link, the back button...) prevails over the last values of the form
    const urlSearch = parseTransportQuery(this.$route?.query);
    const search = urlSearch ?? {
      date: storedContext?.date,
      minDeparture: storedContext?.minDeparture,
      maxReturn: storedContext?.maxReturn,
      maxDuration: storedContext?.maxDuration,
      hikingDuration: storedContext?.hikingDuration,
    };

    // only the coordinates are in the url: the label comes from the addresses already used, if any
    const fromAddress = urlSearch
      ? [storedContext?.fromAddress, ...recentAddresses].find(
          (address) => address && formatTransportFrom(address) === urlSearch.from
        ) ?? null
      : storedContext?.fromAddress ?? null;

    return {
      documentType: this.fixedDocumentType ?? 'route',
      documentTypeOptions: [
        { value: 'route', text: this.$gettext('Route') + 's' },
        { value: 'waypoint', text: this.$gettext('Access points') },
      ],
      fromAddress,
      // the input only reads its address when it is created
      addressReady: !urlSearch || fromAddress !== null,
      addressKey: 0,
      recentAddresses,
      // a past date is of no use: timetables are for the days to come
      date: search.date && search.date >= today() ? search.date : today(),
      minDeparture: search.minDeparture ?? '07:30',
      maxReturn: search.maxReturn ?? '19:00',
      maxDuration: search.maxDuration ?? null,
      hikingDuration: search.hikingDuration ?? null,
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
      return Boolean(formatTransportFrom(this.fromAddress) && this.date && this.minDeparture && this.maxReturn);
    },
    /** The recent starting points, but the selected one */
    otherRecentAddresses() {
      const current = formatTransportFrom(this.fromAddress);
      return this.recentAddresses.filter((address) => formatTransportFrom(address) !== current);
    },
    /** Identifies the transport search of the url: the form follows it when it changes by other means than the form */
    urlSearchKey() {
      const search = parseTransportQuery(this.$route?.query);
      return search ? transportSearchKey(search) : null;
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

  watch: {
    urlSearchKey(key) {
      const search = parseTransportQuery(this.$route.query);
      if (key !== null && key !== this.formSearchKey()) {
        this.applySearch(search);
      }
    },
  },

  mounted() {
    if (!this.addressReady) {
      this.resolveAddress(parseTransportFrom(parseTransportQuery(this.$route.query).from));
    }
  },

  methods: {
    updateFromAddress(address) {
      this.fromAddress = address;
    },

    addressLabel(address) {
      const { name, street, city, country } = address.properties ?? {};
      return [name ?? street, city, country].filter(Boolean).join(', ') || formatTransportFrom(address);
    },

    selectRecentAddress(address) {
      this.fromAddress = address;
      this.addressKey++;
    },

    /** The key of the search the form describes (null when it is not valid) */
    formSearchKey() {
      const from = formatTransportFrom(this.fromAddress);
      return from
        ? transportSearchKey({
            from,
            date: this.date,
            minDeparture: this.minDeparture,
            maxReturn: this.maxReturn,
            maxDuration: this.maxDuration || null,
            hikingDuration: this.effectiveDocumentType === 'route' ? this.hikingDuration || null : null,
          })
        : null;
    },

    /** Fills the form with the search of the url */
    applySearch(search) {
      this.date = search.date;
      this.minDeparture = search.minDeparture;
      this.maxReturn = search.maxReturn;
      this.maxDuration = search.maxDuration;
      this.hikingDuration = search.hikingDuration;

      const known = [this.fromAddress, ...this.recentAddresses].find(
        (address) => address && formatTransportFrom(address) === search.from
      );
      if (known) {
        this.selectRecentAddress(known);
      } else {
        this.addressReady = false;
        this.resolveAddress(parseTransportFrom(search.from));
      }
    },

    /** Finds the address of coordinates (a shared link only has them), to show it as any other starting point */
    async resolveAddress([lon, lat]) {
      let address = { type: 'Feature', geometry: { type: 'Point', coordinates: [lon, lat] }, properties: {} };

      try {
        const response = await photon.reverseGeocodeUserLocation(lon, lat, this.$language.current);
        const data = await response.json();
        // the coordinates stay the ones of the search: the address is only the label
        address = { ...(data.features?.[0] ?? address), geometry: address.geometry };
      } catch (error) {
        console.warn('Error during reverse geolocation:', error);
      }

      this.fromAddress = address;
      this.addressKey++;
      this.addressReady = true;
    },

    /** Remembers the values of the form and its starting point for the next searches */
    rememberSearch() {
      itinevertStorage.set('context', {
        fromAddress: this.fromAddress,
        date: this.date,
        minDeparture: this.minDeparture,
        maxReturn: this.maxReturn,
        maxDuration: this.maxDuration || null,
        hikingDuration: this.hikingDuration || null,
      });

      this.recentAddresses = addRecentAddress(this.recentAddresses, this.fromAddress);
      itinevertStorage.set('recentAddresses', this.recentAddresses);
    },

    async submit() {
      if (!this.isSearchEnabled || this.loading) {
        return;
      }

      this.errorMessage = null;
      this.loading = true;
      this.$emit('loading', true);

      const search = {
        from: formatTransportFrom(this.fromAddress),
        date: this.date,
        minDeparture: this.minDeparture,
        maxReturn: this.maxReturn,
        maxDuration: this.maxDuration || null,
        hikingDuration: this.effectiveDocumentType === 'route' ? this.hikingDuration || null : null,
      };

      try {
        // the API computes the isochrones of this search once, and keeps them: the list of documents, which is
        // filtered with the same parameters, does not compute them again. It also tells now if the search is not
        // possible.
        await itinevertService.getTransportIsochrones(search);
      } catch (error) {
        this.errorMessage = this.formatError(error);
        this.$emit('error', error);
        this.loading = false;
        this.$emit('loading', false);
        return;
      }

      this.rememberSearch();

      const query = buildTransportQuery(search);

      if (this.mode === 'navigate') {
        this.$router.push({ name: this.effectiveDocumentType + 's', query });
      } else {
        // another search: back to the first page
        const currentQuery = withoutTransportQuery(this.$route.query);
        delete currentQuery.offset;
        this.$router.push({ query: { ...currentQuery, ...query } });
      }

      this.loading = false;
      this.$emit('loading', false);
      this.$emit('applied', { documentType: this.effectiveDocumentType, search });
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

.recent-addresses {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  list-style: none;
  margin: 0;
  padding: 0;
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
