<template>
  <section>
    <div class="columns">
      <div class="column is-12-mobile">
        <!-- FORM -->
        <div class="centered" v-if="view === 'form'">
          <!-- input for searchKind (route / waypoint) -->
          <div class="form-input">
            <p class="input-label">Vous recherchez des _____ accessibles en transports en commun</p>
            <input-radio-button
              v-model="formData.searchKind.selected"
              :options="formData.searchKind.options"
              :default-value="formData.searchKind.selected ? formData.searchKind.selected : formData.searchKind.default"
              :display-vertically="true"
            />
          </div>
          <div v-if="formData.searchKind.selected === 'route'" class="form-input">
            <!-- input for activities (only for routes) -->
            <p class="input-label">Quel(s) activité(s) souhaitez-vous pratiquer ?</p>
            <input-activity :document-type="'r'" :show-labels="false" v-model="formData.activities"></input-activity>
          </div>
          <div class="form-input">
            <!-- input for starting point -->
            <p class="input-label">Quel est votre point de départ ?</p>
            <input-address
              :fullwidth="true"
              :placeholder="''"
              :show-address-propositions="true"
              :default-address="formData.startingPoint.selectedAddress"
              @update:props="updateStartingPointAddress"
            ></input-address>
          </div>
          <div class="form-input">
            <!-- input for destination kind -->
            <p class="input-label">Pour définir votre destination, choisissez l'une de ces 2 approches</p>
            <input-radio-button
              v-model="formData.destinationKind.selected"
              :options="formData.destinationKind.options"
              :disabled-options="formData.destinationKind.disabledOptions"
              :default-value="
                formData.destinationKind.selected ? formData.destinationKind.selected : formData.destinationKind.default
              "
              :display-vertically="true"
            />
          </div>
          <div v-if="formData.destinationKind.selected === 'mountain range'" class="form-input">
            <!-- input for destination by 'mountain range' -->
            <p class="input-label">Choix du massif</p>
            <input-autocomplete
              :fullwidth="true"
              :placeholder="''"
              :show-suggestions="true"
              :suggestions="formData.mountainRange.list"
              :default-value="formData.mountainRange.selected"
              :format-suggestion="getTitle"
              @update:props="updateSelectedMountainRange"
            ></input-autocomplete>
          </div>
          <div v-if="formData.destinationKind.selected === 'duration'" class="form-input">
            <!-- input for destination by 'duration' -->
            <p class="input-label">Définissez une durée maximum pour le trajet en transport en commun</p>
            <span>
              <input
                type="number"
                class="maxTripDurationInput"
                v-model="formData.maxTripDuration"
                :min="minTripDuration"
                :max="maxTripDuration"
                :step="tripDurationIncrement"
              />
              minutes
            </span>
          </div>
          <div class="form-input">
            <!-- input for date and time of departure -->
            <p class="input-label">À quelle date et heure souhaitez-vous partir ?</p>
            <div class="select-date-container">
              <div class="date-picker-container">
                <label for="date-input">{{ $gettext('Date') }}</label>
                <div class="input-container">
                  <input type="date" id="date-input" class="date-input" v-model="formData.departure.selectedDate" />
                  <div class="calendar-icon">
                    <img class="geolocalisation-img" src="@/assets/img/boxes/date.svg" alt="date" />
                  </div>
                </div>
              </div>

              <div class="date-picker-container">
                <label for="date-input">{{ $gettext('Preference') }}</label>
                <div class="input-container">
                  <select
                    name="preference"
                    class="date-input"
                    id="preference"
                    v-model="formData.departure.timePreference"
                  >
                    <option value="leave-after">{{ $gettext('Leave after') }}</option>
                    <option value="arrive-before">{{ $gettext('Arrive before') }}</option>
                  </select>
                </div>
              </div>

              <div class="date-picker-container hour-picker-container">
                <label for="date-input">{{ $gettext('Time') }}</label>
                <div class="input-container">
                  <input type="time" id="hour-input" class="hour-input" v-model="formData.departure.selectedTime" />
                </div>
              </div>
            </div>
          </div>
          <button class="button is-primary searchButton" :disabled="!isSearchEnabled()" @click="search">
            <fa-icon class="search-icon" icon="search" aria-hidden="true" />
            {{ $gettext('Search') }}
          </button>
        </div>
        <!-- LIST OF FILTERS WHEN TOO MUCH ROUTE -->
        <div class="centered" v-if="view === 'filter'">
          <div class="filter-header-section">
            <p class="too-much-route-label">Votre recherche concerne un nombre d'itinéraires trop important.</p>
            <p>
              Aidez-nous à mieux cibler les itinéraires pouvant vous intéresser en ajoutant un ou plusieurs filtres.
            </p>
          </div>
          <div class="filter-button-dropdown">
            <dropdown-button
              v-for="(category, index) in categorizedFields"
              :key="category.name"
              :disabled="category.fields.length === 0"
              class="query-item-component"
            >
              <span slot="button" class="button is-size-7-mobile" :disabled="category.fields.length === 0">
                <fa-icon :icon="$options.categoryIcon[category.name]" />
                <span class="is-hidden-mobile">
                  <!-- $gettext('General') -->
                  <!-- $gettext('ratings') -->
                  <!-- $gettext('Terrain') -->
                  <!-- $gettext('Miscs') -->
                  &nbsp;{{ $gettext(category.name) }}
                </span>
                <span v-if="activeFields[index]?.length != 0"> &nbsp;({{ activeFields[index]?.length }}) </span>
                <span>&nbsp;</span>
                <fa-icon icon="angle-down" aria-hidden="true" />
              </span>
              <div class="sub-query-items">
                <itinevert-filter-item
                  v-for="field in category.fields || []"
                  :key="field.field.name"
                  :field="field.field"
                  v-model="field.value"
                  class="dropdown-item"
                ></itinevert-filter-item>
              </div>
            </dropdown-button>
          </div>
          <div
            class="routeCount"
            :class="{ 'pulse-red': highlightedRed, 'pulse-green': highlightedGreen }"
            @animationend="onAnimEnd"
          >
            <p>
              <span :class="{ 'above-max-route': !canDisplayResult, 'under-max-route': canDisplayResult }">
                {{ routeCount }}
              </span>
              {{ routeCountMax }}
            </p>
          </div>
          <div class="filter-buttons">
            <button class="button is-primary" :disabled="!isSearchEnabled()" @click="search">
              Appliquer les filtres
            </button>
            <button
              class="button is-primary"
              @click="() => computeJourneyReachableRoutes()"
              :disabled="!canDisplayResult"
            >
              Afficher les résultats
            </button>
          </div>
        </div>
        <!-- RESULT VIEW -->
        <div class="" v-if="view === 'result'">
          <itinevert-result-view
            :fields="categorizedFields"
            :base-query="baseQuery"
            :documents="formData.searchKind.selected === 'route' ? filteredRoutes : filteredWaypoints"
            :document-type="formData.searchKind.selected"
          ></itinevert-result-view>
        </div>
      </div>
      <div class="column is-3" v-if="view !== 'result'">
        <div class="banner-img"></div>
      </div>
    </div>
  </section>
</template>

<script>
import DropdownButton from '../generics/DropdownButton.vue';
import InputAutocomplete from '../generics/inputs/InputAutocomplete.vue';

import ItinevertFilterItem from './ItinevertFilterItem.vue';
import ItinevertResultView from './ItinevertResultView.vue';

import { default as c2c } from '@/js/apis/c2c';
import itinevertService, {
  MIN_TRIP_DURATION,
  MAX_TRIP_DURATION,
  TRIP_DURATION_INCREMENT,
  MAX_NAVITIA_ISOCHRON_REQUEST_REACHED,
  MAX_ROUTE_THRESHOLD,
  DEFAULT_TRIP_DURATION,
} from '@/js/apis/itinevert-service';
import constants from '@/js/constants';

export default {
  name: 'ItinevertWizard',
  components: {
    ItinevertFilterItem,
    ItinevertResultView,
    InputAutocomplete,
    DropdownButton,
  },
  categoryIcon: {
    General: 'filter',
    MultiSearch: 'filter',
    Miscs: 'database',
    Terrain: ['waypoint', 'summit'],
    ratings: 'tachometer-alt',
  },
  props: {
    view: {
      type: String,
      default: 'form',
    },
  },
  data() {
    return {
      routeFields: constants.objectDefinitions['route'].fields,
      waypointFields: constants.objectDefinitions['waypoint'].fields,
      // data used in form view and filter view
      formData: {
        searchKind: {
          selected: 'route',
          default: 'route',
          options: [
            { value: 'route', text: 'Itinéraires' },
            { value: 'waypoint', text: "Points d'accès" },
          ],
        },
        activities: [],
        startingPoint: {
          selectedAddress: null,
        },
        destinationKind: {
          selected: 'mountain range',
          default: 'mountain range',
          options: [
            {
              value: 'mountain range',
              text: 'Définir le massif dans lequel je souhaite me rendre en transport en commun',
            },
            {
              value: 'duration',
              text: 'Définir une durée maximum pour le trajet en transport en commun',
            },
          ],
          disabledOptions: [],
        },
        mountainRange: {
          selected: null,
          list: [],
        },
        departure: {
          selectedDate: new Date().toISOString().slice(0, 10),
          selectedTime: new Date().toTimeString().slice(0, 5),
          timePreference: 'leave-after',
        },
        otherFilterValues: [],
        // in minutes
        maxTripDuration: DEFAULT_TRIP_DURATION,
      },
      filteredRoutes: {},
      filteredWaypoints: {},
      categorizedFields: [],
      baseQuery: {},
      isUpdating: false, // flag to prevent infinite loops
      highlightedRed: false,
      highlightedGreen: false,
    };
  },

  computed: {
    maxTripDuration() {
      return MAX_TRIP_DURATION;
    },
    minTripDuration() {
      return MIN_TRIP_DURATION;
    },
    tripDurationIncrement() {
      return TRIP_DURATION_INCREMENT;
    },
    routeCount() {
      return this.filteredRoutes.total;
    },
    routeCountMax() {
      return ' / ' + MAX_ROUTE_THRESHOLD + ' itinéraires';
    },
    canDisplayResult() {
      return this.filteredRoutes.total <= MAX_ROUTE_THRESHOLD && this.filteredRoutes.total !== 0;
    },
    activeFields() {
      return this.categorizedFields.map((category) =>
        category.fields.filter((field) => !itinevertService.isFieldValueDefault(field.value, field.field))
      );
    },
  },

  watch: {
    'formData.activities': {
      deep: true,
      handler() {
        this.categorizedFields = this.computeCategorizedFields(this.formData.activities);
      },
    },
    'formData.searchKind.selected': {
      handler() {
        this.categorizedFields = this.computeCategorizedFields([]);
      },
    },
    routeCount: {
      handler(newVal) {
        const startRed = newVal > MAX_ROUTE_THRESHOLD;
        // clear both, flush, then enable only the chosen one
        this.highlightedRed = false;
        this.highlightedGreen = false;
        this.$nextTick(() => {
          // ensure removal applied
          requestAnimationFrame(() => {
            if (startRed) this.highlightedRed = true;
            else this.highlightedGreen = true;
          });
        });
      },
    },
    categorizedFields: {
      deep: true,
      handler(newVal) {
        // Prevent infinite loop
        if (this.isUpdating) return;

        // Check the condition
        if (newVal.length > 0 && newVal[0].fields[0].field.name === 'activities') {
          this.isUpdating = true; // Set the flag

          // Update categorizedFields based on the condition
          this.categorizedFields = this.computeCategorizedFields(newVal[0].fields[0].value);

          // Reset the flag after the update
          this.$nextTick(() => {
            this.isUpdating = false;
          });
        }
      },
    },
    // when we go back to form view, get rid of filters eventually set in filter view (but keep filters in form).
    view: {
      handler(newVal) {
        if (newVal === 'form') {
          // erase stored values
          this.categorizedFields = [];
          // recompute based on formData activities
          if (this.searchKind.selected === 'route') {
            this.categorizedFields = this.computeCategorizedFields(this.formData.activities);
          }
          // reset url parameters
          this.$router.replace({
            path: this.$route.path,
            query: {},
          });
        } else if (newVal === 'result') {
          this.categorizedFields = [];
          this.categorizedFields = this.computeCategorizedFields([]);
          // Initialize URL with document type
          if (this.$route.query.documentType !== this.formData.searchKind.selected) {
            this.$router.replace({
              path: this.$route.path,
              query: { documentType: this.formData.searchKind.selected },
            });
          }
        }
      },
    },
  },

  async mounted() {
    // reset url parameters
    if (Object.keys(this.$router.currentRoute.query)?.length > 0) {
      this.$router.replace({
        path: this.$route.path,
        query: {},
      });
    }

    // get all areas of type "range"
    // so that we can display them in a dropdown
    let areas = await c2c.area.fullDownload({
      atyp: 'range',
    });
    this.formData.mountainRange.list = areas.sort((a, b) => this.getTitle(a).localeCompare(this.getTitle(b)));

    if (MAX_NAVITIA_ISOCHRON_REQUEST_REACHED) {
      this.formData.destinationKind.disabledOptions.push({
        value: 'duration',
        reason: 'Fonctionnalité temporairement indisponible',
      });
    }
  },

  methods: {
    computeCategorizedFields(activities) {
      const result = [];

      for (const category of Object.keys(constants.categorizedFieldsDefault)) {
        const temp = {
          name: category,
          fields: [],
        };

        let addCategory = false;

        for (const name of constants.categorizedFieldsDefault[category]) {
          const field =
            this.formData.searchKind.selected === 'route' ? this.routeFields[name] : this.waypointFields[name];

          if (field !== undefined) {
            addCategory = true;

            if (field.isVisibleForActivities(activities)) {
              if (field?.values?.length > 0) {
                // Try to find existing field from saved result (if it exists)
                const existingCategory = this.categorizedFields?.find((c) => c.name === category);
                const existingField = existingCategory?.fields.find((f) => f.field === field);

                // Reuse existing value if it exists, else initialize new
                let value = existingField?.value?.length ? existingField.value : null;
                if (field.name === 'activities') {
                  value = activities;
                }

                temp.fields.push({ field: field, value: value });
              }
            }
          }
        }

        if (addCategory) {
          result.push(temp);
        }
      }
      return result;
    },
    onAnimEnd(e) {
      if (e.animationName === 'borderPulseRed') this.highlightedRed = false;
      if (e.animationName === 'borderPulseGreen') this.highlightedGreen = false;
    },
    gettext(key, context) {
      return this.$gettext(key, context);
    },
    // callback passed to input address
    updateStartingPointAddress(selectedAddress) {
      this.formData.startingPoint.selectedAddress = selectedAddress;
    },
    // callback passed to input autocomplete
    updateSelectedMountainRange(selectedMountainRange) {
      this.formData.mountainRange.selected = selectedMountainRange;
    },
    /** Return true if search is enabled (all required form fields are set) */
    isSearchEnabled() {
      if (this.formData.searchKind.selected === 'route' && this.formData.activities.length < 1) {
        return false;
      }

      if (
        this.formData.destinationKind.selected === 'mountain range' &&
        this.formData.mountainRange.selected === null
      ) {
        return false;
      }

      if (this.formData.startingPoint.selectedAddress === null || this.formData.startingPoint.selectedAddress === '') {
        return false;
      }

      return true;
    },
    /** Get the title of a document in the current language */
    getTitle(document) {
      return this.$documentUtils.getDocumentTitle(document, c2c.getApiLang(this.$language.current));
    },
    buildQuery() {
      let query = itinevertService.buildQuery(this.activeFields);
      // filter on activities from form
      if (
        this.view === 'form' &&
        this.formData.searchKind.selected === 'route' &&
        this.formData.activities.length > 0
      ) {
        query.act = this.formData.activities.join(',');
      }
      // filter on mountain range from form
      if (this.formData.destinationKind.selected === 'mountain range') {
        query.a = this.formData.mountainRange.selected.document_id;
      }
      this.baseQuery = query;
    },
    async computeJourneyReachableRoutes() {
      this.buildQuery();
      // TODO : this.filteredRoutes = (await itinevertService.getJourneyReachableRoutes(query, this.formData.departure)).data;
      this.baseQuery.limit = 100;
      this.filteredRoutes = (await itinevertService.getReachableRoutes(this.baseQuery)).data;
      this.$emit('change-view', 'result');
    },
    async search() {
      this.buildQuery();
      // compute filter for routes
      if (this.formData.searchKind.selected === 'route') {
        // using Journey API
        if (this.formData.destinationKind.selected === 'mountain range') {
          this.filteredRoutes = (await itinevertService.getReachableRoutes(this.baseQuery)).data;
          if (this.filteredRoutes.total > MAX_ROUTE_THRESHOLD) {
            this.$emit('change-view', 'filter');
          }
        }
        // using Isochron API
        else if (this.formData.destinationKind.selected === 'duration') {
          /* TODO : this.filteredRoutes = (
            (await itinevertService.getIsochronReachableRoutes(
              query,
              this.formData.departure,
              this.formData.maxTripDuration
            )
          )).data;
          */
          this.filteredRoutes = (await itinevertService.getReachableRoutes(this.baseQuery)).data;

          this.$emit('change-view', 'result');
        }
      }

      // compute filter for waypoints
      if (this.formData.searchKind.selected === 'waypoint') {
        // using Journey API
        if (this.formData.destinationKind.selected === 'mountain range') {
          // TODO : this.filteredWaypoints = (await itinevertService.getJourneyReachableWaypoints(query, this.formData.departure)).data;
          this.filteredWaypoints = (await itinevertService.getReachableWaypoints(this.baseQuery)).data;
        }
        // using Isochron API
        else if (this.formData.destinationKind.selected === 'duration') {
          /* TODO : this.filteredWaypoints = (await itinevertService.getIsochronReachableWaypoints
              query,
              this.formData.departure,
              this.formData.maxTripDuration
          )).data;
          */
          this.filteredWaypoints = (await itinevertService.getReachableWaypoints(this.baseQuery)).data;
        }

        this.$emit('change-view', 'result');
      }
    },
  },
};
</script>

<style scoped lang="scss">
.centered {
  margin-left: auto;
  margin-right: auto;
  width: fit-content;
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 60%;
}

.centered > .form-input:first-child {
  padding-top: 15%;
}

.searchButton {
  font-weight: bold;
  width: 40%;
  margin-top: 5%;
  margin-bottom: 15%;
  .search-icon {
    padding-right: 1rem;
  }
}

.form-input {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: flex-start;

  p {
    font-weight: bold;
  }

  .mountainRangeSelector {
    width: 100%;
    border: 1px solid lightgray;
    padding: 5px;
    border-radius: 4px;
  }

  .maxTripDurationInput {
    width: 50px;
    margin-right: 8px;
  }

  .select-date-container {
    display: flex;
    gap: 15px;
    .date-picker-container {
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

        .date-input {
          flex: 1;
          padding: 11px 13px;
          padding-right: 8px;
          border: none;
          outline: none;
          font-size: 15px;
          color: #333;
          background-color: white;
          margin-right: 10px;

          &::-webkit-calendar-picker-indicator {
            opacity: 0;
            position: absolute;
            width: 100%;
            height: 100%;
            cursor: pointer;
          }
        }

        .hour-input {
          flex: 1;
          padding: 11px 8px;
          max-width: 90px;
          margin-left: 5px;
          border: none;
          outline: none;
          font-size: 15px;
          color: #333;

          &::-webkit-calendar-picker-indicator {
            cursor: pointer;
          }
        }

        .calendar-icon {
          display: flex;
          align-items: center;
          padding-right: 10px;
          width: 20px;
          color: #666;
          pointer-events: none;
        }
      }
    }
    .hour-picker-container {
      width: 107px;
    }
  }
}

.banner-img {
  width: 100%;
  height: 100%;
  margin-left: auto;
  background-image: url('https://capdata.centre-valdeloire.fr/apps/media/sites/capdata-v2/Accueil/header_home.svg');
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  min-height: 70vh;
}

.above-max-route {
  color: red;
}

.under-max-route {
  color: green;
}

.filter-buttons {
  display: flex;
  justify-content: space-between;
}

.routeCount {
  padding: 2rem;
  font-weight: bold;
  border-radius: 10px;
  background: #ebebeb;
  border: 1px solid #d1d1d1;
}

.pulse-green {
  animation: borderPulseGreen 1s ease;
}
.pulse-red {
  animation: borderPulseRed 1s ease;
}

.filter-header-section {
  padding: 2rem;
  border-radius: 10px;
  background: #ebebeb;
  border: 1px solid #d1d1d1;
  font-weight: bold;
  .too-much-route-label {
    color: #ff3262;
    padding-bottom: 2rem;
  }
}
.dropdown-item {
  color: #4a4a4a;
  display: block;
  font-size: 0.875rem;
  line-height: 1.5;
  padding: 0.375rem 1rem;
  position: relative;
}

.query-item-component {
  margin-bottom: 0.5rem;
}

.sub-query-items {
  @media screen and (min-width: $tablet) {
    min-width: 300px;
  }

  @media screen and (max-width: $tablet) {
    overflow-y: scroll;
    overflow-x: hidden;
    /*
      max-height should be calculated:
      100vh-($navbar-height)-height(.search-infos)
      but .search-infos height is not fixed
    */
    max-height: 70vh;

    scrollbar-width: none; // Firefox

    &::-webkit-scrollbar {
      display: none; // Chrome, Safari and Opera
    }
  }
}

@media screen and (min-width: $tablet) {
  .query-item-component {
    margin-right: 0.75em;
  }
}

@media screen and (max-width: 528px) {
  .select-date-container {
    width: 100%;
    flex-wrap: wrap;
    justify-content: space-between;
    .date-picker-container:first-child {
      max-width: none !important;
    }
  }
}

@media screen and (max-width: $tablet) {
  .centered {
    margin-left: auto;
    margin-right: auto;
    width: fit-content;
    display: flex;
    flex-direction: column;
    gap: 24px;
    width: 90%;
  }

  .searchButton {
    width: 100%;
  }

  .banner-img {
    display: none !important;
  }

  .filter-buttons {
    .button {
      max-width: 45%;
      white-space: normal;
      height: auto;
    }
  }

  .query-item-component {
    margin-right: 0.25em;
  }

  .query-items-filters {
    position: relative; // important, to force drop down on the left
  }

  .dropdown {
    position: unset; // important, to force drop down on the left
  }
}
.filter-button-dropdown {
  display: flex;
  justify-content: space-between;
}

/* green pulse */
@keyframes borderPulseGreen {
  0% {
    box-shadow: 0 0 0 0 rgba(0, 150, 136, 0);
    border-color: rgba(0, 150, 136, 0);
  }
  20% {
    box-shadow: 0 0 6px 1px rgba(0, 150, 136, 0.18);
    border-color: rgba(0, 150, 136, 0.45);
  }
  60% {
    box-shadow: 0 0 6px 1px rgba(0, 150, 136, 0.1);
    border-color: rgba(0, 150, 136, 0.22);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(0, 150, 136, 0);
    border-color: rgba(0, 0, 0, 0.12);
  }
}

/* red pulse */
@keyframes borderPulseRed {
  0% {
    box-shadow: 0 0 0 0 rgba(220, 53, 69, 0);
    border-color: rgba(220, 53, 69, 0);
  }
  20% {
    box-shadow: 0 0 6px 1px rgba(220, 53, 69, 0.18);
    border-color: rgba(220, 53, 69, 0.45);
  }
  60% {
    box-shadow: 0 0 6px 1px rgba(220, 53, 69, 0.1);
    border-color: rgba(220, 53, 69, 0.22);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(220, 53, 69, 0);
    border-color: rgba(0, 0, 0, 0.12);
  }
}
</style>
