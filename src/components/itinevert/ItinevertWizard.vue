<template>
  <section>
    <div class="columns">
      <div class="column is-12-mobile">
        <!-- FORM -->
        <div class="centered" v-if="view === 'form'">
          <!-- input for searchKind (route / waypoint) -->
          <div class="form-input">
            <p class="input-label">
              {{ $gettext('You are looking for ____ accessible by public transport') }}
            </p>
            <input-radio-button
              v-model="formData.searchKind.selected"
              :options="formData.searchKind.options"
              :default-value="formData.searchKind.selected ? formData.searchKind.selected : formData.searchKind.default"
              :display-vertically="true"
            />
          </div>
          <div v-if="formData.searchKind.selected === 'route'" class="form-input">
            <!-- input for activities (only for routes) -->
            <p class="input-label" v-translate>What activity(ies) would you like to do?</p>
            <input-activity :document-type="'r'" :show-labels="false" v-model="formData.activities"></input-activity>
          </div>
          <div class="form-input">
            <!-- input for starting point -->
            <p class="input-label" v-translate>What is your starting point?</p>
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
            <p class="input-label" v-translate>To define your destination, choose one of these 2 approaches</p>
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
            <p class="input-label">{{ $gettext('Choice of massif') }}</p>
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
            <div>
              <p class="input-label">
                {{ $gettext('Set a maximum duration for the journey by public transport') }}
              </p>
            </div>
            <span>
              <input
                type="number"
                class="maxTripDurationInput"
                v-model="formData.maxTripDuration"
                :min="minTripDuration"
                :max="maxTripDuration"
                :step="tripDurationIncrement"
                @blur="formatTripDuration"
              />
              {{ $gettext('minutes') }}
            </span>
          </div>
          <div class="form-input">
            <!-- input for date and time of departure -->
            <p class="input-label" v-translate>What date and time would you like to leave?</p>
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
          <div class="searchButton">
            <button class="button is-primary" :disabled="!isSearchEnabled()" @click="search">
              <fa-icon class="search-icon" icon="search" aria-hidden="true" />
              {{ $gettext('Search') }}
            </button>
            <span class="no-result-found" v-show="noResultsFound" v-translate>No result found</span>
          </div>
        </div>
        <!-- LIST OF FILTERS WHEN TOO MUCH ROUTE -->
        <itinevert-filter-view
          class="centered filter-view"
          v-if="view === 'filter'"
          :categorized-fields="categorizedFields"
          :filtered-routes="filteredRoutes"
          :is-search-enabled="isSearchEnabled()"
          @search="search"
          @computeJourneyReachableRoutes="computeJourneyReachableRoutes"
        ></itinevert-filter-view>
        <!-- RESULT VIEW -->
        <div v-if="view === 'result' && !noResultsFound">
          <itinevert-result-view
            :fields="categorizedFields"
            :base-query="baseQuery"
            :documents="formData.searchKind.selected === 'route' ? filteredRoutes : filteredWaypoints"
            :document-type="formData.searchKind.selected"
            :polygon-geometry="polygonGeometry"
          ></itinevert-result-view>
        </div>
        <!-- NO RESULTS FOUND VIEW -->
        <itinevert-no-result-view class="centered" v-show="view === 'result' && noResultsFound" />
        <!-- LOADING VIEW -->
        <itinevert-loading-view v-show="view === 'loading'"></itinevert-loading-view>
      </div>
      <div class="column is-3" v-if="view !== 'result' || noResultsFound">
        <div class="banner-img"></div>
      </div>
    </div>
  </section>
</template>

<script>
import InputAutocomplete from '../generics/inputs/InputAutocomplete.vue';

import ItinevertFilterView from './ItinevertFilterView.vue';
import ItinevertLoadingView from './ItinevertLoadingView.vue';
import ItinevertNoResultView from './ItinevertNoResultView.vue';
import ItinevertResultView from './ItinevertResultView.vue';

import { default as c2c } from '@/js/apis/c2c';
import itinevertService, {
  MIN_TRIP_DURATION,
  MAX_TRIP_DURATION,
  TRIP_DURATION_INCREMENT,
  MAX_NAVITIA_ISOCHRONES_REQUEST_REACHED,
  MAX_ROUTE_THRESHOLD,
  DEFAULT_TRIP_DURATION,
  createBboxString,
  projectCoordinates,
} from '@/js/apis/itinevert-service';
import constants from '@/js/constants';

export default {
  name: 'ItinevertWizard',
  components: {
    ItinevertFilterView,
    ItinevertResultView,
    ItinevertNoResultView,
    ItinevertLoadingView,
    InputAutocomplete,
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
            { value: 'route', text: this.$gettext('Route') + 's' },
            { value: 'waypoint', text: this.$gettext('Access points') },
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
              text: this.$gettext('Define the mountain range I wish to travel to by public transport'),
            },
            {
              value: 'duration',
              text: this.$gettext('Set a maximum duration for the journey by public transport'),
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
      polygonGeometry: null,
    };
  },

  computed: {
    noResultsFound() {
      if (this.formData?.searchKind?.selected === 'route') {
        return this.filteredRoutes?.documents?.length === 0;
      } else if (this.formData?.searchKind?.selected === 'waypoint') {
        return this.filteredWaypoints?.documents?.length === 0;
      } else {
        return false;
      }
    },
    maxTripDuration() {
      return MAX_TRIP_DURATION;
    },
    minTripDuration() {
      return MIN_TRIP_DURATION;
    },
    tripDurationIncrement() {
      return TRIP_DURATION_INCREMENT;
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
          this.filteredRoutes = {};
          this.filteredWaypoints = {};
          // recompute based on formData activities
          if (this.formData.searchKind?.selected === 'route') {
            this.categorizedFields = this.computeCategorizedFields(this.formData.activities);
          }
          if (Object.keys(this.$router.currentRoute.query)?.length > 0) {
            // reset url parameters
            this.$router.replace({
              path: this.$route.path,
              query: {},
            });
          }
        } else if (newVal === 'result') {
          this.categorizedFields = [];
          this.categorizedFields = this.computeCategorizedFields(this.formData.activities);
          // build query based on active fields
          let query = itinevertService.buildQuery(this.activeFields);
          // Initialize URL with document type & activities
          if (this.$route.query.documentType !== this.formData.searchKind.selected) {
            this.$router.replace({
              path: this.$route.path,
              query: { documentType: this.formData.searchKind.selected, act: query.act },
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

    if (MAX_NAVITIA_ISOCHRONES_REQUEST_REACHED) {
      this.formData.destinationKind.disabledOptions.push({
        value: 'duration',
        reason: this.$gettext('Feature temporarily unavailable'),
      });
    }
  },

  methods: {
    formatTripDuration(event) {
      const tripDuration = event.target.value;
      // make sure trip duration is between limits
      if (tripDuration > this.maxTripDuration) {
        this.formData.maxTripDuration = this.maxTripDuration;
      } else {
        if (tripDuration < this.minTripDuration) {
          this.formData.maxTripDuration = this.minTripDuration;
        } else {
          this.formData.maxTripDuration = tripDuration;
        }
      }
    },
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
    // callback passed to input address
    updateStartingPointAddress(selectedAddress) {
      this.formData.startingPoint.selectedAddress = selectedAddress;
    },
    // callback passed to input autocomplete
    async updateSelectedMountainRange(selectedMountainRange) {
      // requery choosen area to get its geometry
      let prefered_lang = c2c.getApiLang(this.$language.current);
      let area = (await c2c.area.get(selectedMountainRange.document_id, prefered_lang)).data;
      this.formData.mountainRange.selected = area;
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
      this.$emit('change-view', 'loading');
      this.buildQuery();
      this.filteredRoutes = (
        await itinevertService.getJourneyReachableRoutes(
          this.baseQuery,
          this.formData.departure,
          this.formData.startingPoint.selectedAddress
        )
      ).data;
      this.polygonGeometry = JSON.parse(this.formData.mountainRange.selected.geometry.geom_detail);
      this.$emit('change-view', 'result');
    },
    async search() {
      this.buildQuery();
      // compute filter for routes
      if (this.formData.searchKind.selected === 'route') {
        // using Journey API
        if (this.formData.destinationKind.selected === 'mountain range') {
          // save if view is form before loading
          let isViewForm = false;
          if (this.view === 'form') {
            isViewForm = true;
            this.$emit('change-view', 'loading');
          }
          this.filteredRoutes = (await itinevertService.getReachableRoutes(this.baseQuery)).data;
          if (this.filteredRoutes.total > MAX_ROUTE_THRESHOLD) {
            this.$emit('change-view', 'filter');
          } else {
            // go straight to result, skipping filter screen since < MAX_ROUTE_THRESHOLD
            if (isViewForm) {
              this.$emit('change-view', 'result');
            }
          }
        }
        // using Isochrones API
        else if (this.formData.destinationKind.selected === 'duration') {
          this.$emit('change-view', 'loading');
          let data = (
            await itinevertService.getIsochronesReachableRoutes(
              this.baseQuery,
              this.formData.departure,
              this.formData.maxTripDuration,
              this.formData.startingPoint.selectedAddress
            )
          ).data;

          this.filteredRoutes = {
            documents: data.documents,
            total: data.total,
          };

          // add isochron_geom as bbox to reduce time of request
          let coordinates = projectCoordinates(data.isochron_geom.coordinates);
          this.polygonGeometry = { type: data.isochron_geom.type, coordinates: coordinates };
          this.baseQuery.bbox = createBboxString(coordinates);

          this.$emit('change-view', 'result');
        }
      }

      // compute filter for waypoints
      if (this.formData.searchKind.selected === 'waypoint') {
        this.$emit('change-view', 'loading');
        // using Journey API
        if (this.formData.destinationKind.selected === 'mountain range') {
          this.filteredWaypoints = (
            await itinevertService.getJourneyReachableWaypoints(
              this.baseQuery,
              this.formData.departure,
              this.formData.startingPoint.selectedAddress
            )
          ).data;
          this.polygonGeometry = JSON.parse(this.formData.mountainRange.selected.geometry.geom_detail);
        }
        // using Isochrones API
        else if (this.formData.destinationKind.selected === 'duration') {
          let data = (
            await itinevertService.getIsochronesReachableWaypoints(
              this.baseQuery,
              this.formData.departure,
              this.formData.maxTripDuration,
              this.formData.startingPoint.selectedAddress
            )
          ).data;

          this.filteredWaypoints = {
            documents: data.documents,
            total: data.total,
          };

          // add isochron_geom as bbox to reduce time of request
          let coordinates = projectCoordinates(data.isochron_geom.coordinates);
          this.polygonGeometry = { type: data.isochron_geom.type, coordinates: coordinates };
          this.baseQuery.bbox = createBboxString(coordinates);
        }
        this.$emit('change-view', 'result');
      }
    },
  },
};
</script>

<style scoped lang="scss">
.centered {
  margin: auto;
  min-height: 80vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 24px;
  width: 60%;
}

.filter-view {
  padding-top: 16px;
  justify-content: flex-start !important;
}

.searchButton {
  display: flex;
  font-weight: bold;
  margin-top: 5%;
  align-items: center;
  gap: 16px;
  .button {
    width: 40%;
  }
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
    width: 100%;
    display: flex;
    gap: 15px;
    flex-wrap: wrap;
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
  height: 100%;
  width: 100%;
  margin-left: auto;
  background-image: url('../../assets/img/itinevert/itinevert-banner.png');
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
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
}
</style>
