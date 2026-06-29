<template>
  <div class="itineraries-container" :class="{ updating: isUpdating }" v-if="currentData.journeys.length > 0">
    <div class="last-journey-message" v-if="noResult">
      {{ $gettext('Here is the last journey of the day :') }}
    </div>
    <div class="itinerary-card" v-for="(journey, index) in currentData.journeys" :key="index">
      <div
        class="itinerary-header"
        :class="{ selected: currentData.selectedRouteJourney === journey }"
        @click="selectRouteOnly(journey)"
      >
        <div class="itinerary-time">
          {{ formatTime(journey.departure_date_time) }} — {{ formatTime(journey.arrival_date_time) }}
          <span class="journey-duration">{{ formatJourneyDuration(journey.duration) }}</span>
        </div>

        <div class="itinerary-path">
          <div class="journey-steps">
            <div v-for="(section, sectionIndex) in journey.sections" :key="sectionIndex" class="step-wrapper">
              <div
                v-if="
                  section.type === 'public_transport' ||
                  section.type === 'transfer' ||
                  section.type === 'street_network' ||
                  section.type === 'on_demand_transport'
                "
                class="journey-step"
              >
                <div
                  v-if="section.type === 'public_transport' || section.type === 'on_demand_transport'"
                  class="transport-icon"
                  :class="getTransportClass(section)"
                >
                  <img :src="require(`@/assets/img/boxes/${getTransportIcon(section)}.svg`)" alt="walking" />
                </div>
                <div
                  v-else-if="
                    section.type === 'street_network' || section.type === 'transfer' || section.mode === 'walking'
                  "
                  class="transport-icon walking"
                >
                  <img src="@/assets/img/boxes/walk.svg" alt="walking" />
                </div>
              </div>
              <div v-if="sectionIndex < journey.sections.length - 1 && section.type !== 'waiting'" class="connector">
                <img src="@/assets/img/boxes/chevron_right.svg" alt="chevron" />
              </div>
            </div>
          </div>
        </div>

        <div class="itinerary-details-button">
          <button class="button is-info is-light" @click="showJourneyDetails(journey)">
            {{ currentData.selectedJourney === journey ? $gettext('Hide details') : $gettext('View details') }}
          </button>
        </div>
      </div>

      <div class="journey-details" v-if="currentData.selectedJourney === journey">
        <div class="journey-timeline">
          <div class="timeline-item">
            <div class="timeline-time">{{ formatTime(journey.departure_date_time) }}</div>
            <div class="timeline-icon-end">
              <img src="@/assets/img/boxes/end.svg" alt="end" />
            </div>
            <div class="timeline-content" v-if="activeTab === 'outbound'">
              <div class="timeline-address">{{ displayedFromAddress }}</div>
            </div>
            <div class="timeline-content" v-else>
              <div class="timeline-address">{{ currentData.selectedWaypoint?.title || 'Destination' }}</div>
            </div>
          </div>

          <!-- Affichage des sections de l'itinéraire -->
          <div v-for="(section, sectionIndex) in journey.sections" :key="sectionIndex">
            <!-- Section marche à pied -->
            <div
              v-if="section.type === 'street_network' || section.type === 'transfer' || section.mode === 'walking'"
              class="timeline-item walking"
            >
              <div class="timeline-time"></div>
              <div class="timeline-icon walking">
                <img src="@/assets/img/boxes/walk.svg" alt="walking" />
              </div>
              <div class="timeline-content">
                <div class="timeline-walking-info">
                  {{ getDistance(section) }} {{ $gettext('Meter(s)').toLowerCase() }},
                  {{ formatDuration(section.duration) }}
                </div>
              </div>
            </div>

            <!-- Section transport en commun -->
            <div v-else-if="section.type === 'public_transport' || section.type === 'on_demand_transport'">
              <!-- Arrêt de départ -->
              <div class="timeline-item">
                <div class="timeline-time">{{ formatTime(section.departure_date_time) }}</div>
                <div class="timeline-icon stop">
                  <i class="stop-circle"></i>
                </div>
                <div class="timeline-content">
                  <div class="timeline-stop-name">
                    <strong>{{ $gettext('Stop') }} : </strong> {{ section.from?.name || 'Départ' }}
                  </div>
                </div>
              </div>

              <!-- Ligne de transport -->
              <div
                class="timeline-item transport"
                :class="getTransportColorClass(section)"
                :style="{
                  'border-left': section.display_informations?.color
                    ? `3px solid #${
                        section.display_informations.color === 'FFFFFF' ? '808080' : section.display_informations.color
                      }`
                    : '3px solid gray',
                }"
              >
                <div class="timeline-content">
                  <div class="timeline-line">
                    <strong>{{ $gettext('Line') }} : </strong> {{ section.display_informations?.code || '' }}
                    <img
                      v-if="section.display_informations?.equipments?.includes('has_bike_accepted')"
                      src="@/assets/img/boxes/velo.svg"
                      alt="bike accepted"
                    />
                    <span v-if="section.type === 'on_demand_transport'" class="on-demand-text">
                      {{ $gettext('Warning, this transport is on demand ⚠') }}
                    </span>
                  </div>
                  <div class="timeline-direction">
                    <strong>{{ $gettext('Direction') }} : </strong>{{ section.display_informations?.direction || '' }}
                  </div>
                  <div class="timeline-duration">
                    <strong>{{ $gettext('Duration') }} : </strong
                    >{{ formatJourneyDuration(calculateSectionDuration(section)) }}
                  </div>
                  <div class="timeline-accessibility" v-if="section.display_informations?.equipments?.length">
                    <img
                      v-if="section.display_informations.equipments.includes('has_bike_accepted')"
                      src="@/assets/img/boxes/velo.svg"
                      alt="bike"
                    />
                    <img
                      v-if="section.display_informations.equipments.includes('has_wheelchair')"
                      src="@/assets/img/boxes/handi_accessible.svg"
                      alt="wheelchair"
                    />
                  </div>
                </div>
              </div>

              <!-- Arrêt d'arrivée -->
              <div class="timeline-item">
                <div class="timeline-time">{{ formatTime(section.arrival_date_time) }}</div>
                <div class="timeline-icon stop">
                  <i class="stop-circle"></i>
                </div>
                <div class="timeline-content">
                  <div class="timeline-stop-name">
                    <strong>{{ $gettext('Stop') }} : </strong>{{ section.to?.name || 'Arrivée' }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Heure et adresse d'arrivée -->
          <div class="timeline-item destination">
            <div class="timeline-time">{{ formatTime(journey.arrival_date_time) }}</div>
            <div class="timeline-icon-end">
              <img src="@/assets/img/boxes/end.svg" alt="end" />
            </div>
            <div class="timeline-content" v-if="activeTab === 'outbound'">
              <div class="timeline-address">{{ currentData.selectedWaypoint?.title || 'Destination' }}</div>
            </div>
            <div class="timeline-content" v-else>
              <div class="timeline-address">{{ displayedToAddress }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import planATripUtils from '@/js/plan-a-trip-utils';

export default {
  components: {},
  mixins: [],
  props: {
    activeTab: {
      type: String,
      default: 'outbound',
    },
    currentData: {
      type: Object,
      default: () => ({
        fromAddress: '',
        selectedAddress: null,
        addressPropositions: [],
        showAddressPropositions: false,
        selectedDate: new Date().toISOString().slice(0, 10),
        selectedTime: new Date().toTimeString().slice(0, 5),
        timePreference: 'leave-after',
        fromCoordinates: null,
        selectedWaypoint: null,
        journeys: [],
        selectedJourney: null,
        noResult: false,
        selectedRouteJourney: null,
        showTimeButton: false,
        isUpdating: false,
        missingDepartureAddress: false,
        missingDestinationAddress: false,
      }),
    },
    isUpdating: {
      type: Boolean,
      default: false,
    },
    noResult: {
      type: Boolean,
      default: false,
    },
    displayedFromAddress: {
      type: String,
      default: '',
    },
    displayedToAddress: {
      type: String,
      default: '',
    },
  },
  computed: {},
  methods: {
    ...planATripUtils,
    /** Shows route details */
    showJourneyDetails(journey) {
      this.currentData.selectedRouteJourney = journey;

      if (this.currentData.selectedJourney === journey) {
        this.currentData.selectedJourney = null;
      } else {
        this.currentData.selectedJourney = journey;
      }
    },
    /** Selects a route without opening details */
    selectRouteOnly(journey) {
      this.currentData.selectedRouteJourney = journey;
      this.$emit('selectJourney', journey);
    },
  },
};
</script>
<style lang="scss" scoped>
.itineraries-container {
  max-width: 490px;
  flex: 1;
  padding-right: 16px;
  transition: background-color 0.3s ease;
  position: relative;

  .itinerary-header {
    border: 1px solid lightgrey;
    border-left: 4px solid #337ab7;
    border-radius: 4px;
    padding: 10px;
    margin-top: 12px;
    cursor: pointer;
    .itinerary-time {
      display: flex;
      .journey-duration {
        margin-left: auto;
        margin-right: 5px;
        font-weight: bold;
      }
    }

    .journey-steps {
      display: flex;
      margin-top: 8px;
      flex-wrap: wrap;

      .step-wrapper {
        display: flex;
        gap: 15px;

        .journey-step {
          .transport-icon {
            margin-left: 8px;
          }
        }
      }
    }
  }
  .selected {
    border-left: 4px solid #4baf50;
    background-color: #fbfaf6;
  }
  // Bouton "Voir le détail"
  .itinerary-details-button {
    text-align: left;

    button {
      background-color: transparent;
      color: #3273dc;
      border: none;
      padding: 0;
      font-size: 14px;
      cursor: pointer;
      text-decoration: underline;

      &:hover {
        color: #2366d1;
      }
    }
  }

  // Détails du trajet
  .journey-details {
    font-family: Arial, sans-serif;
    max-width: 650px;
    margin: 0 auto;
    padding: 15px;
    border-bottom-left-radius: 6px;
    border-bottom-right-radius: 6px;
    border: solid 1px lightgray;
    border-top: none;
    background-color: #fff;

    .journey-timeline {
      position: relative;

      .timeline-item {
        display: flex;
        align-items: center;
        position: relative;

        &.transport-color-default {
          border-left-color: gray;
        }

        &.walking {
          border-left: 3px dotted #0000ff;
          margin-left: 52px;
          padding-top: 10px;
          padding-bottom: 10px;
        }

        &.transport {
          padding-left: 22px;
          margin-left: 52px;
          padding-top: 10px;
          padding-bottom: 10px;
        }
      }

      .timeline-time {
        width: 60px;
        font-weight: bold;
        font-size: 14px;
        padding-top: 2px;
      }

      .timeline-icon,
      .timeline-icon-beginning,
      .timeline-icon-end {
        position: relative;
        z-index: 2;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background-color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 15px 0 -45px;

        &.stop {
          background-color: #fff;
          width: 15px;
          height: 15px;
          border: 2px solid grey;
          margin-left: -14px;
        }

        &.walking {
          border: none;
          background: none;

          img {
            width: 20px;
            height: 20px;
          }
        }

        &.transport {
          border: none;
          color: #fff;
          width: 32px;
          height: 32px;
        }

        i {
          display: inline-block;
          width: 12px;
          height: 12px;
        }
      }

      .timeline-icon-beginning,
      .timeline-icon-end {
        margin: 0 15px 0 -22px;
      }

      .timeline-content {
        flex: 1;
        padding-top: 2px;

        .timeline-address {
          font-size: 15px;
          margin-left: -8px;
          font-weight: bold;
        }

        .timeline-walking-info {
          font-size: 14px;
          color: #757575;
          display: flex;
          align-items: center;
          margin-left: -14px;
        }

        .timeline-stop-name {
          font-size: 15px;
        }

        .timeline-line {
          font-size: 14px;
          .on-demand-text {
            background-color: rgba(255, 165, 0, 0.5);
            font-style: italic;
          }
        }

        .timeline-direction {
          font-size: 14px;
          margin-top: 2px;
        }

        .timeline-accessibility {
          display: flex;
          margin-top: 5px;

          img {
            width: 20px;
            height: 20px;
            margin-right: 8px;
          }
        }
      }
    }
  }

  .timeline-item:last-child {
    .timeline-icon {
      border: none;
      background: none;
    }
  }
}

.itineraries-container.updating::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  z-index: 10;
  pointer-events: none;
}
</style>
