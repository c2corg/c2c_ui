<template>
  <div class="plan-trip-section">
    <div class="plan-trip-info">
      <div class="plan-trip-content">
        <h3 class="plan-trip-title">{{ $gettext('Planifier un trajet de transport en commun') }}</h3>

        <div class="plan-trip-details">
          <div class="plan-trip-from-to">
            <div class="from-to-container">
              <div class="from-container">
                <div class="from-text">De</div>
                <input class="from-address" v-model="text" />
                <button class="geolocalisation">
                  <img class="geolocalisation-img" src="@/assets/img/boxes/toggle_plus.svg" />
                </button>
              </div>
              <div class="to-container">
                <div class="to-text">À</div>
                <select name="chose-waypoint" class="chose-waypoint" id="chose-waypoint">
                  <option value="test1">test1</option>
                  <option value="test2">test2</option>
                </select>
              </div>
            </div>
            <button class="reverse-from-to">
              <img class="" src="@/assets/img/boxes/toggle_plus.svg" />
            </button>
          </div>

          <div class="select-date-container">
            <div class="date-picker-container">
              <label for="date-input">Date</label>
              <div class="input-container">
                <input type="date" id="date-input" class="date-input" />
                <div class="calendar-icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
              </div>
            </div>

            <div class="date-picker-container">
              <label for="date-input">Préférence</label>
              <div class="input-container">
                <select name="preference" class="date-input" id="preference">
                  <option value="leave-after">Partir après</option>
                  <option value="arrive-before">Arriver avant</option>
                </select>
              </div>
            </div>

            <div class="date-picker-container hour-picker-container">
              <label for="date-input">Heure</label>
              <div class="input-container">
                <input type="time" id="hour-input" class="hour-input" />
                <div class="calendar-icon">
                  <img class="" src="@/assets/img/boxes/toggle_plus.svg" />
                </div>
              </div>
            </div>
          </div>

          <button class="button is-primary plan-trip-search-button">
            <img class="" src="@/assets/img/boxes/toggle_plus.svg" />
            <p class="plan-trip-search-button-text">{{ $gettext('Calculer mon itinéraire') }}</p>
          </button>
        </div>
      </div>
    </div>

    <div class="plan-trip-map">
      <map-view
        ref="mapView"
        :documents="mapDocuments"
        :show-protection-areas="['r', 'w'].includes(document.type)"
        :biodiv-sports-activities="document.activities"
        :full-screen-element-id="
          !$screen.isMobile && showElevationProfile && elevationProfileHasData ? 'fullscreen-map-container' : null
        "
        @has-protection-area="$emit('has-protection-area')"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'PlanATripSection',
  props: {
    document: {
      type: Array,
      required: true,
    },
    mapDocuments: {
      type: Array,
      required: true,
    },
    showElevationProfile: {
      type: Boolean,
      default: false,
    },
    elevationProfileHasData: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      // Ajoutez ici les données spécifiques à ce composant
    };
  },
  methods: {
    // Ajoutez ici les méthodes spécifiques à ce composant
  },
};
</script>

<style scoped lang="scss">
.plan-trip-section {
  margin-top: 20px;
  display: flex;
  gap: 20px;
  height: 500px;

  .plan-trip-info {
    flex: 1;
    height: 100%;
    overflow-y: auto;

    .plan-trip-content {
      .plan-trip-title {
        font-size: 15px;
        font-weight: bold;
        margin-bottom: 15px;
      }

      .plan-trip-details {
        display: flex;
        flex-direction: column;
        gap: 15px;

        > p {
          margin-bottom: 10px;
        }

        .plan-trip-from-to {
          display: flex;
          width: 100%;
          margin-bottom: 18px;

          .from-to-container {
            width: 80%;
            .from-container {
              display: flex;
              border: 1px solid lightgray;
              padding: 5px;
              border-radius: 4px;
              margin-bottom: 15px;
              .from-text {
                padding-left: 5px;
                width: 32px;
                border-right: 1px solid lightgray;
                font-weight: 600;
              }
              .from-address {
                margin-left: 10px;
                border: none;
                outline: none;
                width: 80%;
              }
              .geolocalisation {
                border-radius: 15px;
                margin-left: auto;
                border: 1px solid lightgray;
                background-color: white;
                .geolocalisation-img {
                  height: 16px;
                  width: 16px;
                }
              }
            }
            .to-container {
              display: flex;
              border: 1px solid lightgray;
              padding: 5px;
              border-radius: 4px;
              .to-text {
                width: 32px;
                padding-left: 5px;
                border-right: 1px solid lightgray;
                font-weight: 600;
              }
              .chose-waypoint {
                border: none;
                margin-left: 10px;
                width: 100%;
              }
            }
          }
          .reverse-from-to {
            border-radius: 4px;
            height: 35px;
            width: 35px;
            margin-top: auto;
            margin-bottom: auto;
            padding: 4px;
            margin-left: auto;
            margin-right: 15px;
            border: 1px solid lightgray;
            background-color: white;
          }
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
              z-index: 999;
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
                padding: 12px 14px;
                padding-right: 8px;
                width: 20px;
                border: none;
                outline: none;
                font-size: 16px;
                color: #333;

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
                padding: 12px 12px;
                max-width: 70px;
                border: none;
                outline: none;
                font-size: 16px;
                color: #333;

                &::-webkit-calendar-picker-indicator {
                  opacity: 0;
                  position: absolute;
                  width: 100%;
                  height: 100%;
                  cursor: pointer;
                }
              }

              .calendar-icon {
                display: flex;
                align-items: center;
                padding-right: 10px;
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

      .plan-trip-search-button {
        margin-top: 10px;
        padding: 16px;
        display: flex;
        max-width: 220px;
        .plan-trip-search-button-img {
        }
        .plan-trip-search-button-text {
          font-weight: 600;
          margin-left: 12px;
        }
      }
    }
  }

  .plan-trip-map {
    height: auto;
    width: 600px;
    border: 1px solid lightgray;
    border-radius: 4px;
  }
}

@media only screen and (max-width: 600px) {
  .plan-trip-section {
    display: inline !important;

    .plan-trip-info {
      margin-bottom: 20px;
    }

    .plan-trip-map {
      height: 275px !important;
      width: 319px !important;
      margin-left: auto;
      margin-right: auto;
    }
  }
}
</style>
