<template>
  <div class="plan-trip-form">
    <div class="plan-trip-from-to">
      <div class="addresses-container">
        <div class="from-to-container">
          <!-- Trajet ALLER : De = adresse, À = waypoint -->
          <template v-if="activeTab === 'outbound'">
            <div class="from-container">
              <div class="from-text">{{ $gettext('From') }}</div>
              <input-address
                class="input-address"
                :fullwidth="true"
                :placeholder="$gettext('Enter a departure address')"
                :show-address-propositions="currentData.showAddressPropositions"
                :default-address="currentData.fromAddress"
                @update:props="
                  (address) => {
                    $emit('update-from-address', address);
                  }
                "
              ></input-address>
            </div>
            <div class="to-container">
              <div class="to-text">{{ $gettext('To') }}</div>
              <template v-if="accessWaypoints.length > 1">
                <select
                  name="chose-waypoint"
                  class="chose-waypoint"
                  id="chose-waypoint"
                  v-model="currentData.selectedWaypoint"
                  @change="$emit('update-selected-waypoint', currentData.selectedWaypoint)"
                >
                  <option v-for="waypoint in accessWaypoints" :key="waypoint.id" :value="waypoint">
                    {{ waypoint.title }}
                  </option>
                </select>
              </template>
              <template v-else-if="accessWaypoints.length === 1">
                <div class="single-waypoint to-address">
                  {{ accessWaypoints[0].title }}
                </div>
              </template>
              <template v-else>
                <div class="no-waypoint" v-if="loadingReachable">{{ $gettext('Loading access points...') }}</div>
                <div class="no-waypoint to-address" v-else>{{ $gettext('No access points available') }}</div>
              </template>
            </div>
          </template>

          <!-- Trajet RETOUR : De = waypoint, À = adresse -->
          <template v-else>
            <div class="to-container-return">
              <div class="to-text">{{ $gettext('From') }}</div>
              <select
                name="chose-waypoint"
                class="chose-waypoint"
                id="chose-waypoint-return"
                v-model="currentData.selectedWaypoint"
                @change="$emit('update-selected-waypoint', currentData.selectedWaypoint)"
              >
                <option v-for="waypoint in accessWaypoints" :key="waypoint.id" :value="waypoint">
                  {{ waypoint.title }}
                </option>
              </select>
            </div>
            <div class="from-container-return">
              <div class="from-text">{{ $gettext('To') }}</div>
              <input-address
                class="input-address"
                :fullwidth="true"
                :placeholder="$gettext('Enter a departure address')"
                :show-address-propositions="currentData.showAddressPropositions"
                :default-address="currentData.fromAddress"
                @update:props="
                  (address) => {
                    $emit('update-from-address', address);
                  }
                "
              ></input-address>
            </div>
          </template>
        </div>
        <div class="swap-icon" v-if="documentType === 'waypoint' && document.waypoint_type === 'access'">
          <button class="swap-button" @click="$emit('swap-addresses')">
            <img class="swap-image" src="@/assets/img/boxes/swap.svg" alt="swap" />
          </button>
        </div>
      </div>
    </div>

    <div class="select-date-container">
      <div class="date-picker-container">
        <label for="date-input">{{ $gettext('Date') }}</label>
        <div class="input-container">
          <input
            type="date"
            id="date-input"
            class="date-input"
            v-model="currentData.selectedDate"
            @change="$emit('update-selected-date', currentData.selectedDate)"
          />
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
            v-model="currentData.timePreference"
            @change="$emit('update-time-preference', currentData.timePreference)"
          >
            <option value="leave-after">{{ $gettext('Leave after') }}</option>
            <option value="arrive-before">{{ $gettext('Arrive before') }}</option>
          </select>
        </div>
      </div>

      <div class="date-picker-container hour-picker-container">
        <label for="date-input">{{ $gettext('Time') }}</label>
        <div class="input-container">
          <input
            type="time"
            id="hour-input"
            class="hour-input"
            v-model="currentData.selectedTime"
            @change="$emit('update-selected-time', currentData.selectedTime)"
          />
        </div>
      </div>
    </div>

    <div class="chose-transfer-limit">
      <div class="chose-if-transfer-wanted">
        <label for="limitTransfers" class="toggle-label">
          {{ $gettext('Limit the number of connections') }}
        </label>
        <label class="toggle">
          <input
            type="checkbox"
            id="btnToggle"
            name="btnToggle"
            :checked="limitTransfers"
            @change="$emit('update-limit-transfers', $event.target.checked)"
          />
          <span class="slider"></span>
        </label>
      </div>
      <div v-if="limitTransfers" class="chose-nb-transfer" id="transferCountContainer">
        <select
          class="number-dd"
          id="number-dd"
          name="number"
          :value="maxTransfers"
          @change="$emit('update-max-transfers', Number($event.target.value))"
        >
          <option value="0" :selected.attr="'selected'">0 (direct)</option>
          <option value="1">1 max</option>
          <option value="2">2 max</option>
          <option value="3">3 max</option>
          <option value="4">4 max</option>
          <option value="5">5 max</option>
        </select>
      </div>
    </div>

    <div v-if="currentData.missingDepartureAddress || currentData.missingDestinationAddress" class="non-valid-address">
      <div v-if="currentData.missingDepartureAddress">
        {{ $gettext('Please select a departure address.') }}
      </div>
      <div v-if="currentData.missingDestinationAddress">
        {{ $gettext('Please select a destination.') }}
      </div>
    </div>
  </div>
</template>

<script>
import { requireDocumentProperty } from '@/js/properties-mixins';

export default {
  mixins: [requireDocumentProperty],
  props: {
    activeTab: {
      type: String,
      required: true,
    },
    currentData: {
      type: Object,
      required: true,
    },
    accessWaypoints: {
      type: Array,
      required: true,
    },
    loadingReachable: {
      type: Boolean,
      default: false,
    },
    limitTransfers: {
      type: Boolean,
      default: false,
    },
    maxTransfers: {
      type: Number,
      default: 0,
    },
  },
  emits: [
    'update-from-address',
    'update-selected-waypoint',
    'update-selected-date',
    'update-time-preference',
    'update-selected-time',
    'update-limit-transfers',
    'update-max-transfers',
    'swap-addresses',
  ],
};
</script>

<style scoped lang="scss">
.plan-trip-from-to {
  display: flex;
  width: 100%;
  margin-bottom: 18px;

  .addresses-container {
    display: flex;
    flex-direction: row;
    gap: 15px;
    width: 100%;

    .swap-icon {
      flex: 0 0 10%;
      display: flex;
      .swap-button {
        margin: auto;
        cursor: pointer;
        background: white;
        border: 1px solid lightgray;
        height: 40px;
        width: 40px;
        .swap-image {
          margin: auto;
          width: 20px;
          height: 20px;
        }
      }
      .swap-button:hover {
        background: #eeeeee;
      }
    }
  }

  .from-to-container {
    flex: 0 0 80%;
    width: 80%;
    position: relative;
    .from-container,
    .from-container-return {
      display: flex;
      border: 1px solid lightgray;
      padding: 5px;
      border-radius: 4px;
      margin-bottom: 15px;
      .from-text {
        align-self: center;
        padding-left: 5px;
        width: 32px;
        border-right: 1px solid lightgray;
        font-weight: 600;
      }
      .autocomplete-container {
        width: 100%;
        position: relative;
        .from-address {
          padding-left: 10px;
          border: none;
          outline: none;
          text-overflow: ellipsis;
          white-space: nowrap;
          overflow: hidden;
          width: inherit;
        }
        .autocomplete-results {
          position: absolute;
          background-color: white;
          border: 1px solid lightgrey;
          z-index: 2;
          margin-top: 5px;
          ul {
            li {
              padding: 6px;
              border-bottom: 1px solid lightgrey;
            }
          }
        }
      }
      .geolocalisation {
        border-radius: 15px;
        border: 1px solid lightgray;
        background-color: white;
        height: 25px;
        position: absolute;
        width: 29px;
        right: 0;
        margin-right: 5px;
        top: 4px;
        .geolocalisation-img {
          height: 18px;
          width: 18px;
          display: flex;
        }
      }
      .geolocalisation-return {
        top: 52px;
      }
    }
    .from-container-return {
      margin-bottom: 0px;
    }

    .to-container,
    .to-container-return {
      display: flex;
      border: 1px solid lightgray;
      padding: 5px;
      border-radius: 4px;
      .to-text {
        align-self: center;
        width: 30px;
        padding-left: 5px;
        border-right: 1px solid lightgray;
        font-weight: 600;
      }
      .to-address {
        padding-left: 8px;
        color: black;
      }
      .chose-waypoint {
        border: none;
        margin-left: 10px;
        width: 100%;
        background-color: white;
      }
    }
    .to-container-return {
      margin-bottom: 15px;
    }
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
        width: 20px;
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
        color: #666;
        pointer-events: none;
      }
    }
  }
  .hour-picker-container {
    width: 107px;
  }
}
.chose-transfer-limit {
  display: flex;
  position: relative;
  width: fit-content;
  .chose-if-transfer-wanted {
    display: flex;
    align-items: center;
    gap: 10px;

    .toggle-label {
      line-height: normal;
    }
  }

  .toggle {
    position: relative;
    display: inline-block;
    width: 30px;
    height: 17px;

    input {
      display: none;
    }
  }

  .slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #333;
    transition: 0.4s;
    border-radius: 34px;
  }

  .slider:before {
    position: absolute;
    content: '';
    height: 13px;
    width: 13px;
    left: 2px;
    bottom: 2px;
    background-color: #fff;
    transition: 0.4s;
    border-radius: 50%;
  }

  input:checked + .slider {
    background-color: #337ab7;
  }

  input:checked + .slider:before {
    transform: translateX(13px);
  }

  .chose-nb-transfer {
    margin-left: 14px;
    position: absolute;
    right: -108px;
    top: -2px;
    display: flex;
    gap: 4px;
    align-items: center;

    .number-dd {
      padding: 3px;
      text-align: center;
      border-radius: 4px;
    }
  }
}

@media only screen and (max-width: 1650px) {
  .chose-transfer-limit {
    display: block;
    .chose-nb-transfer {
      position: initial;
      margin-top: 10px;
    }
  }
}

.non-valid-address {
  color: red;
}
.input-address {
  ::v-deep .from-container {
    border: none !important;
    box-shadow: none !important;
  }
}

.plan-trip-form {
  display: flex;
  flex-direction: column;
  gap: 15px;

  > p {
    margin-bottom: 10px;
  }
}
</style>
