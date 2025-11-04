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
              :default-value="formData.searchKind.default"
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
              :default-value="formData.destinationKind.default"
              :display-vertically="true"
            />
          </div>
          <div v-if="formData.destinationKind.selected === 'mountain range'" class="form-input">
            <!-- input for destination by 'mountain range' -->
            <p class="input-label">Choix du massif</p>
            <select
              name="mountainRangeSelector"
              class="mountainRangeSelector"
              v-model="formData.mountainRange.selected"
            >
              <option v-for="option in formData.mountainRange.list" :value="option" :key="getTitle(option)">
                {{ getTitle(option) }}
              </option>
            </select>
          </div>
          <div v-if="formData.destinationKind.selected === 'duration'" class="form-input">
            <!-- input for destination by 'duration' -->
            <p class="input-label">Définissez une durée maximum pour le trajet en transport en commun</p>
            <span>
              <input
                type="number"
                class="maxTripDurationInput"
                v-model="formData.maxTripDuration"
                min="15"
                max="240"
                step="10"
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
                <Itinevert-filter-item
                  v-for="field in category.fields || []"
                  :key="field.field.name"
                  :field="field.field"
                  v-model="field.value"
                  class="dropdown-item"
                ></Itinevert-filter-item>
              </div>
            </dropdown-button>
          </div>
          <div class="routeCount">
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
              @click="() => $emit('change-view', 'result')"
              :disabled="!canDisplayResult"
            >
              Afficher les résultats
            </button>
          </div>
        </div>
        <!-- RESULT VIEW -->
        <div class="" v-if="view === 'result'">
          <Itinevert-result-view
            :fields="categorizedFields"
            :documents="formData.searchKind.selected === 'route' ? filteredRoutes : filteredWaypoints"
            :document-type="formData.searchKind.selected"
          ></Itinevert-result-view>
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

import ItinevertFilterItem from './ItinevertFilterItem.vue';
import ItinevertResultView from './ItinevertResultView.vue';

import { default as c2c } from '@/js/apis/c2c';
import transportService from '@/js/apis/transport-service';
import constants from '@/js/constants';

/** Constant to define the maximum number of route before going over each of their waypoint and making a Navitia API Call */
const MAX_ROUTE_THRESHOLD = 50;

export default {
  name: 'ItinevertWizard',
  components: {
    ItinevertFilterItem,
    ItinevertResultView,
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
        maxTripDuration: 120,
      },
      filteredRoutes: [],
      filteredRoutesWaypoints: [],
      filteredWaypoints: [],
      categorizedFields: [],
      isUpdating: false, // flag to prevent infinite loops
    };
  },

  computed: {
    routeCount() {
      return this.filteredRoutes.total;
    },
    routeCountMax() {
      return ' / ' + MAX_ROUTE_THRESHOLD + ' itinéraires';
    },
    canDisplayResult() {
      return this.filteredRoutes.total < MAX_ROUTE_THRESHOLD && this.filteredRoutes.total !== 0;
    },
    activeFields() {
      return this.categorizedFields.map((category) =>
        category.fields.filter((field) => !this.fieldIsDefault(field.value, field.field))
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
          this.categorizedFields = this.computeCategorizedFields(this.formData.activities);
        }
      },
    },
  },

  async mounted() {
    // get all areas of type "range"
    // so that we can display them in a dropdown
    let areas = await c2c.area.fullDownload({
      atyp: 'range',
    });
    this.formData.mountainRange.list = areas.sort((a, b) => a.title - b.title);
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
    gettext(key, context) {
      return this.$gettext(key, context);
    },
    // callback passed to input address
    updateStartingPointAddress(selectedAddress) {
      this.formData.startingPoint.selectedAddress = selectedAddress;
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
    /** Return default value for a field */
    initialValue(field) {
      if (!field) return null;
      if (field.queryMode === 'activities') return [];
      if (field.queryMode === 'orientations') return [];
      if (field.queryMode === 'multiSelect' || field.queryMode === 'tristate') return [];
      if (field.queryMode === 'checkbox') return false;
      if (field.queryMode === 'valuesRangeSlider' || field.queryMode === 'numericalRangeSlider') {
        return [field.values?.[0] ?? 0, field.values?.[field.values.length - 1] ?? 0];
      }
      return '';
    },
    /** Test if a field's value is default value or different */
    fieldIsDefault(fieldValue, field) {
      const initialVal = this.initialValue(field);

      // Compare for null
      if (fieldValue === null) {
        return true;
      }

      // Compare for array
      if (Array.isArray(initialVal)) {
        return (
          Array.isArray(fieldValue) &&
          initialVal.length === fieldValue.length &&
          initialVal.every((val, index) => val === fieldValue[index])
        );
      }

      // Compare for boolean
      if (typeof initialVal === 'boolean') {
        return initialVal === fieldValue;
      }

      // Compare for numerical ranges
      if (Array.isArray(initialVal) && typeof initialVal[0] === 'number') {
        return (
          Array.isArray(fieldValue) &&
          fieldValue.length === 2 &&
          initialVal[0] === fieldValue[0] &&
          initialVal[1] === fieldValue[1]
        );
      }

      // General compare for strings
      return initialVal === fieldValue;
    },
    async search() {
      // compute filter for routes
      if (this.formData.searchKind.selected === 'route') {
        let query = {};
        if (this.view === 'form' && this.formData.activities.length > 0) {
          // only keep route where activities selected can be made
          query.act = this.formData.activities.join(',');
        }

        if (this.formData.destinationKind.selected === 'mountain range') {
          query.a = this.formData.mountainRange.selected.document_id;
        }

        // loop over each category ('General', 'ratings', 'Terrain', 'Misc')
        for (let category of Object.keys(this.activeFields)) {
          // loop over each active fields to enhance the query
          for (let field of this.activeFields[category]) {
            query[field.field.url] = field.field.valueToUrl(field.value);
          }
        }
        // download routes and keep only the routes that have at least one waypoint as a stoparea
        let routes = await c2c.route.fullDownload(query);

        let reachableRoutes = await Promise.all(
          routes.map(async (route) => {
            const waypoints = await transportService.getWaypointsAccessibleTC(route.document_id);
            if (waypoints?.length > 0) {
              return { route: route, waypoints: waypoints }; // return both the route and waypoint IDs
            } else {
              return null;
            }
          })
        );

        // remove null items (=== routes that are not reachable)
        reachableRoutes = reachableRoutes.filter((item) => item !== null);

        // get all waypoints ids from reachable routes and make a unique set of these ids
        const allWaypoints = reachableRoutes.flatMap((item) => item.waypoints);

        const uniqueWaypointsMap = new Map();

        allWaypoints.forEach((waypoint) => {
          // use waypoint id for uniqueness criteria
          if (!uniqueWaypointsMap.has(waypoint.id)) {
            uniqueWaypointsMap.set(waypoint.id, waypoint);
          }
        });

        // convert the map values back to an array to get the unique waypoints
        this.filteredRoutesWaypoints = Array.from(uniqueWaypointsMap.values());
        console.log('les waypoints à requêté par navitia');
        console.log(this.filteredRoutesWaypoints);

        // get all routes that are reachable
        routes = reachableRoutes.filter((item) => item.route !== null).map((item) => item.route);
        this.filteredRoutes = { documents: routes, total: routes.length };
        console.log('les routes filtrés : ');
        console.log(routes);

        if (this.view === 'form' && this.filteredRoutes.total > MAX_ROUTE_THRESHOLD) {
          this.$emit('change-view', 'filter');
        }
      }

      // compute filter for waypoints
      if (this.formData.searchKind.selected === 'waypoint') {
        let query = {};

        if (this.formData.destinationKind.selected === 'mountain range') {
          query.a = this.formData.mountainRange.selected.document_id;
        }
        const docs = await c2c.waypoint.fullDownload(query);
        this.filteredWaypoints = { documents: docs, total: docs.length };
        console.log(this.filteredWaypoints);
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
  max-width: 75%;
}

.centered > .form-input:first-child {
  padding-top: 15%;
}

.searchButton {
  margin-top: 5%;
  margin-bottom: 15%;
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

@media screen and (max-width: $tablet) {
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
</style>
