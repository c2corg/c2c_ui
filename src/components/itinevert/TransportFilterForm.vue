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
        @update:props="fromAddress = $event"
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
          <label :for="`${id}-date`">{{ $gettext('Date') }}</label>
          <div class="input-container">
            <input type="date" :id="`${id}-date`" :min="twoDaysAgo" v-model="date" />
          </div>
        </div>
        <div class="date-picker-container">
          <label :for="`${id}-min-departure`">{{ $gettext('Departure after') }}</label>
          <div class="input-container">
            <input type="time" :id="`${id}-min-departure`" v-model="minDeparture" />
          </div>
        </div>
        <div class="date-picker-container">
          <label :for="`${id}-return-date`">{{ $gettext('Return date (optional)') }}</label>
          <div class="input-container">
            <input
              type="date"
              :id="`${id}-return-date`"
              :min="date"
              v-model="returnDate"
              :aria-describedby="datesErrorMessage ? `${id}-dates-error` : undefined"
            />
          </div>
        </div>
        <div class="date-picker-container">
          <label :for="`${id}-max-return`">{{ $gettext('Return before') }}</label>
          <div class="input-container">
            <input type="time" :id="`${id}-max-return`" v-model="maxReturn" />
          </div>
        </div>
      </div>
    </div>

    <p class="hint-message" v-if="returnDate && returnDate !== date">
      {{ $gettext('Trip of several days: the outbound is on the departure date, the return on the return date.') }}
    </p>
    <p class="error-message" :id="`${id}-dates-error`" v-if="datesErrorMessage">{{ datesErrorMessage }}</p>

    <div class="form-input advanced-section">
      <button type="button" class="advanced-toggle" @click="showAdvanced = !showAdvanced">
        <fa-icon icon="angle-down" :rotation="showAdvanced ? 180 : undefined" aria-hidden="true" />
        {{ $gettext('Advanced options') }}
      </button>
      <div v-if="showAdvanced" class="advanced-fields">
        <div class="advanced-field">
          <label :for="`${id}-max-duration`">
            {{ $gettext('Maximum one-way transport duration') }}
          </label>
          <span>
            <input
              type="number"
              :id="`${id}-max-duration`"
              class="advanced-number-input"
              v-model.number="maxDuration"
              :min="MIN_TRIP_DURATION"
              :max="MAX_TRIP_DURATION"
              :step="TRIP_DURATION_INCREMENT"
            />
            {{ $gettext('minutes') }}
          </span>
        </div>
        <div class="advanced-field" v-if="effectiveDocumentType === 'route'">
          <label :for="`${id}-hiking-duration`">
            {{ $gettext('Hiking duration budget') }}
          </label>
          <span>
            <input
              type="number"
              :id="`${id}-hiking-duration`"
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

    <div class="search-button">
      <button class="button is-primary" :disabled="!isSearchEnabled || loading" @click="submit">
        <fa-icon class="search-icon" icon="search" aria-hidden="true" />
        {{ $gettext('Search') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, type PropType, ref, useId, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import itinevertService, {
  MAX_TRIP_DURATION,
  MIN_TRIP_DURATION,
  TRIP_DURATION_INCREMENT,
  type DocumentType,
  type TransportSearch,
} from '@/js/apis/itinevert-service';
import navitiaService from '@/js/apis/navitia-service';
import photon from '@/js/apis/photon';
import { useGlobalProperties } from '@/js/composables/global-properties';
import {
  type AddressSelection,
  addRecentAddress,
  buildTransportQuery,
  formatTransportFrom,
  laterReturnDate,
  type ParsedTransportSearch,
  parseTransportFrom,
  parseTransportQuery,
  transportDatesError,
  transportSearchKey,
  withoutTransportQuery,
} from '@/js/transport-query';
import { getPreferences } from '@/js/vue-plugins/local-storage';

type StoredContext = Partial<Omit<TransportSearch, 'from'>> & { fromAddress?: AddressSelection | null };

const props = defineProps({
  /**
   * 'navigate': checks the search then navigates to the corresponding Topoguide page. 'patch': patches the
   * `transport_*` parameters on the current route, in place.
   */
  mode: {
    type: String as PropType<'navigate' | 'patch'>,
    required: true,
    validator: (value: string) => ['navigate', 'patch'].includes(value),
  },
  /** When set, hides the route/waypoint choice and always searches for this document type */
  fixedDocumentType: {
    type: String as PropType<DocumentType | null>,
    default: null,
    validator: (value: string | null) => value === null || ['route', 'waypoint'].includes(value),
  },
});

const emit = defineEmits<{
  loading: [loading: boolean];
  error: [error: unknown];
  applied: [applied: { documentType: DocumentType; search: TransportSearch }];
}>();

/**
 * Shared local storage entry remembering the last values of the form (`context`) and the starting points already used
 * (`recentAddresses`), so that they are not typed again
 */
const itinevertStorage = getPreferences('itinevert');

const route = useRoute();
const router = useRouter();
const { $gettext, $language } = useGlobalProperties();
const id = `transport-${useId()}`;

const today = () => new Date().toISOString().slice(0, 10);

const storedContext = itinevertStorage.get<StoredContext | null>('context', null);
const recentAddresses = ref(itinevertStorage.get<AddressSelection[]>('recentAddresses', []));
// the search of the url (a shared link, the back button...) prevails over the last values of the form
const urlSearch = parseTransportQuery(route.query);
const search: Partial<ParsedTransportSearch> = urlSearch ?? {
  date: storedContext?.date,
  minDeparture: storedContext?.minDeparture,
  returnDate: storedContext?.returnDate,
  maxReturn: storedContext?.maxReturn,
  maxDuration: storedContext?.maxDuration,
  hikingDuration: storedContext?.hikingDuration,
};

const documentType = ref<DocumentType>(props.fixedDocumentType ?? 'route');
const documentTypeOptions = [
  { value: 'route', text: $gettext('Route') + 's' },
  { value: 'waypoint', text: $gettext('Access points') },
];

// only the coordinates are in the url: the label comes from the addresses already used, if any
const fromAddress = ref<AddressSelection | null>(
  urlSearch
    ? ([storedContext?.fromAddress, ...recentAddresses.value].find(
        (address) => address && formatTransportFrom(address) === urlSearch.from
      ) ?? null)
    : (storedContext?.fromAddress ?? null)
);
// the input only reads its address when it is created
const addressReady = ref(!urlSearch || fromAddress.value !== null);
const addressKey = ref(0);
// a past date is of no use: timetables are for the days to come
const date = ref(search.date && search.date >= today() ? search.date : today());
// optional: empty for a return the same day as the departure
const returnDate = ref(search.returnDate && search.returnDate >= today() ? search.returnDate : '');
const minDeparture = ref(search.minDeparture ?? '07:30');
const maxReturn = ref(search.maxReturn ?? '19:00');
const maxDuration = ref<number | null>(search.maxDuration ?? null);
const hikingDuration = ref<number | null>(search.hikingDuration ?? null);
const showAdvanced = ref(false);
const loading = ref(false);
const errorMessage = ref<string | null>(null);

const errorMessages: Record<string, string> = {
  no_solution: $gettext('It seems your trip can not be completed on the selected date and time'),
  unknown_object: $gettext(
    "The start and finish points are too far apart to find a route. Choose a start in a city closer to the route's access point."
  ),
  unknown_error: $gettext('An unknown error occurred.'),
  navitia_internal_error: $gettext('Public transport data is currently unavailable.'),
  auth_error: $gettext('Authentication to public transport data service error.'),
  invalid_param: $gettext('Invalid parameters were sent to public transport data service.'),
};

const effectiveDocumentType = computed(() => props.fixedDocumentType ?? documentType.value);

/** The dates and times of the form, as checked by `transportDatesError` */
const datesSearch = computed(() => ({
  date: date.value,
  returnDate: returnDate.value,
  minDeparture: minDeparture.value,
  maxReturn: maxReturn.value,
}));

const isSearchEnabled = computed(() =>
  Boolean(
    formatTransportFrom(fromAddress.value) &&
    date.value &&
    minDeparture.value &&
    maxReturn.value &&
    !transportDatesError(datesSearch.value)
  )
);

const datesErrorMessage = computed(() => {
  switch (transportDatesError(datesSearch.value)) {
    case 'return-before-departure':
      return $gettext('The return date must not be before the departure date.');
    case 'return-time-before-departure-time':
      return $gettext('For a return the same day, the return time must be after the departure time.');
    default:
      return null;
  }
});

/** The recent starting points, but the selected one */
const otherRecentAddresses = computed(() => {
  const current = formatTransportFrom(fromAddress.value);
  return recentAddresses.value.filter((address) => formatTransportFrom(address) !== current);
});

const twoDaysAgo = (() => {
  const d = new Date();
  d.setDate(d.getDate() - 2);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
})();

/** The search the form describes (null when it has no valid starting point) */
function formSearch(): TransportSearch | null {
  const from = formatTransportFrom(fromAddress.value);
  return from
    ? {
        from,
        date: date.value,
        returnDate: laterReturnDate(datesSearch.value),
        minDeparture: minDeparture.value,
        maxReturn: maxReturn.value,
        maxDuration: maxDuration.value || null,
        hikingDuration: effectiveDocumentType.value === 'route' ? hikingDuration.value || null : null,
      }
    : null;
}

function addressLabel(address: AddressSelection) {
  const { name, street, city, country } = address.properties ?? {};
  return [name ?? street, city, country].filter(Boolean).join(', ') || formatTransportFrom(address) || '';
}

function selectRecentAddress(address: AddressSelection) {
  fromAddress.value = address;
  addressKey.value++;
}

/** Finds the address of coordinates (a shared link only has them), to show it as any other starting point */
async function resolveAddress([lon, lat]: number[]) {
  let address: AddressSelection = {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [lon, lat] },
    properties: {},
  };

  try {
    const response = await photon.reverseGeocodeUserLocation(lon, lat, $language.current!);
    const data = await response.json();
    // the coordinates stay the ones of the search: the address is only the label
    address = { ...(data.features?.[0] ?? address), geometry: address.geometry };
  } catch (error) {
    console.warn('Error during reverse geolocation:', error);
  }

  fromAddress.value = address;
  addressKey.value++;
  addressReady.value = true;
}

/** Fills the form with the search of the url */
function applySearch(search: ParsedTransportSearch) {
  date.value = search.date;
  returnDate.value = search.returnDate ?? '';
  minDeparture.value = search.minDeparture;
  maxReturn.value = search.maxReturn;
  maxDuration.value = search.maxDuration;
  hikingDuration.value = search.hikingDuration;

  const known = [fromAddress.value, ...recentAddresses.value].find(
    (address) => address && formatTransportFrom(address) === search.from
  );
  if (known) {
    selectRecentAddress(known);
  } else {
    addressReady.value = false;
    resolveAddress(parseTransportFrom(search.from));
  }
}

/** Remembers the values of the form and its starting point for the next searches */
function rememberSearch() {
  itinevertStorage.set('context', {
    fromAddress: fromAddress.value,
    date: date.value,
    returnDate: laterReturnDate(datesSearch.value),
    minDeparture: minDeparture.value,
    maxReturn: maxReturn.value,
    maxDuration: maxDuration.value || null,
    hikingDuration: hikingDuration.value || null,
  });

  recentAddresses.value = addRecentAddress(recentAddresses.value, fromAddress.value!);
  itinevertStorage.set('recentAddresses', recentAddresses.value);
}

function formatError(error: unknown) {
  const { response, message } = (error ?? {}) as {
    response?: { data?: { errors?: { description?: unknown }[] } | string };
    message?: string;
  };
  const data = response?.data;
  const rawData = (typeof data === 'object' ? data?.errors?.[0]?.description : undefined) ?? data ?? message;
  const parsed = navitiaService.handleQueryError(rawData) as string | { id?: string; message?: string } | undefined;
  const errorId = typeof parsed === 'string' ? parsed : (parsed?.id ?? parsed?.message);
  return (errorId && errorMessages[errorId]) || errorMessages.unknown_error;
}

async function submit() {
  const search = formSearch();
  if (!search || !isSearchEnabled.value || loading.value) {
    return;
  }

  errorMessage.value = null;
  loading.value = true;
  emit('loading', true);

  try {
    // the API computes the isochrones of this search once, and keeps them: the list of documents, which is filtered
    // with the same parameters, does not compute them again. It also tells now if the search is not possible.
    await itinevertService.getTransportIsochrones(search);
  } catch (error) {
    errorMessage.value = formatError(error);
    emit('error', error);
    loading.value = false;
    emit('loading', false);
    return;
  }

  rememberSearch();

  const query = buildTransportQuery(search);

  if (props.mode === 'navigate') {
    router.push({ name: effectiveDocumentType.value + 's', query });
  } else {
    // another search: back to the first page
    const currentQuery = withoutTransportQuery(route.query);
    delete currentQuery.offset;
    router.push({ query: { ...currentQuery, ...query } });
  }

  loading.value = false;
  emit('loading', false);
  emit('applied', { documentType: effectiveDocumentType.value, search });
}

// the form follows the search of the url when it changes by other means than the form (back button, shared link)
watch(
  () => {
    const search = parseTransportQuery(route.query);
    return search ? transportSearchKey(search) : null;
  },
  (key) => {
    const search = parseTransportQuery(route.query);
    const current = formSearch();
    if (search && key !== (current ? transportSearchKey(current) : null)) {
      applySearch(search);
    }
  }
);

onMounted(() => {
  if (!addressReady.value && urlSearch) {
    resolveAddress(parseTransportFrom(urlSearch.from));
  }
});
</script>

<style scoped>
.transport-filter-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.recent-addresses {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.form-input {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: flex-start;

  p {
    font-weight: bold;
  }
}

.select-date-container {
  width: 100%;
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;

  .date-picker-container {
    align-self: flex-end;
    width: 100%;
    max-width: 150px;
    position: relative;

    label {
      position: absolute;
      font-size: var(--c2c-size-7);
      color: var(--c2c-text);
      padding: 0 0.3rem;
      left: 0;
      background-color: var(--c2c-body-background-color);
      z-index: 1;
      margin-left: 1.25rem;
      margin-top: -0.6rem;
    }

    .input-container {
      position: relative;
      width: 100%;
      border: 1px solid var(--c2c-grey-lighter);
      border-radius: 10px;
      overflow: hidden;
      display: flex;

      input {
        flex: 1;
        padding: 11px 13px;
        border: none;
        outline: none;
        font-size: 15px;
        color: var(--c2c-text);
        background-color: var(--c2c-body-background-color);
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
    gap: 0.5rem;
    color: var(--c2c-color-base-c2c);
  }

  .advanced-fields {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-top: 0.75rem;

    .advanced-field {
      display: flex;
      flex-direction: column;
      gap: 0.375rem;

      label {
        font-weight: normal;
      }

      .advanced-number-input {
        width: 70px;
        margin-right: 0.5rem;
      }
    }
  }
}

.error-message {
  color: var(--c2c-danger);
  font-weight: bold;
}

.hint-message {
  color: var(--c2c-grey-dark);
  font-size: var(--c2c-size-7);
}

.search-button {
  display: flex;
  font-weight: bold;
  align-items: center;
  gap: 1rem;

  .search-icon {
    padding-right: 1rem;
  }
}
</style>
