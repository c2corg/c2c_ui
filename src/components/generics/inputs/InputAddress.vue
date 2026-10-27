<template>
  <div :class="['control', { fullwidth: fullwidth }]">
    <div class="from-container">
      <div class="autocomplete-container">
        <input
          class="from-address"
          :class="[{ 'prevent-zoom-on-ios': isIos }]"
          v-model="localData.address"
          @input="searchAddressPropositions"
          @focus="localData.showAddressPropositions = true"
          @blur="handleBlur"
          :placeholder="placeholder"
          autocomplete="address-line1"
        />
        <div
          class="autocomplete-results"
          v-if="localData.showAddressPropositions && localData.addressPropositions?.length > 0"
        >
          <ul>
            <li
              v-for="(proposition, index) in localData.addressPropositions"
              :key="index"
              @mousedown="selectAddress(proposition)"
            >
              {{ formatProposition(proposition) }}
            </li>
          </ul>
        </div>
      </div>
      <button
        type="button"
        class="geolocalisation"
        @click="useCurrentLocation"
        :aria-label="$gettext('Use current location')"
      >
        <img class="geolocalisation-img" src="@/assets/img/boxes/geoloc.svg" alt="geoloc" />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toast } from 'bulma-toast';
import { onBeforeUnmount, onMounted, reactive, watch } from 'vue';

import { default as c2c } from '@/js/apis/c2c';
import photon from '@/js/apis/photon';
import { useGlobalProperties } from '@/js/composables/global-properties';
import ol from '@/js/libs/ol';

type Proposition = {
  type?: string;
  geometry: { type?: string; coordinates: number[] };
  properties?: Record<string, string | undefined>;
  address?: string;
};

const props = defineProps({
  fullwidth: {
    type: Boolean,
    default: false,
  },
  placeholder: {
    type: String,
    default: '',
  },
  showAddressPropositions: {
    type: Boolean,
    default: false,
  },
  mapView: {
    type: Object,
    default: null,
  },
  defaultAddress: {
    type: [Object, String],
    default: null,
  },
});

const emit = defineEmits(['update:props']);

const { $gettext, $language, $user } = useGlobalProperties();

/** Format address proposition rendered by Photon */
function formatProposition(proposition: Proposition) {
  const properties = proposition.properties || {};
  const coords = proposition.geometry?.coordinates;
  if (Object.keys(properties).length === 0) {
    if (coords?.length >= 2) {
      return `${coords[0].toFixed(4)}, ${coords[1].toFixed(4)}`;
    }
    return '';
  }

  let formattedAddress = properties.name || '';

  if (properties.housenumber) {
    formattedAddress = `${formattedAddress} ${properties.housenumber}`;
  }

  if (properties.street) {
    formattedAddress = `${formattedAddress} ${properties.street}`;
  }

  if (properties.city) {
    formattedAddress = `${formattedAddress}${formattedAddress ? ', ' : ''}${properties.city}`;
  }

  if (properties.postcode) {
    formattedAddress = `${formattedAddress} ${properties.postcode}`;
  }

  if (properties.country) {
    formattedAddress = `${formattedAddress}${formattedAddress ? ', ' : ''}${properties.country}`;
  }

  return formattedAddress;
}

const localData = reactive({
  address: props.defaultAddress ? formatProposition(props.defaultAddress as Proposition) : '',
  selectedAddress: '' as Proposition | '',
  addressPropositions: [] as Proposition[],
  showAddressPropositions: props.showAddressPropositions,
  coordinates: null as number[] | null,
});
let searchTimeout: ReturnType<typeof setTimeout> | undefined;

const isIos = (() => {
  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';
  // Old iPhones/iPads/iPods
  if (/iPad|iPhone|iPod/i.test(ua) || /iPad|iPhone|iPod/i.test(platform)) return true;
  // iPadOS 13+ reports MacIntel but has touch points > 1
  if (platform === 'MacIntel' && navigator.maxTouchPoints > 1) return true;
  return false;
})();

function notifyParent() {
  emit('update:props', localData.selectedAddress);
}

watch(() => localData.selectedAddress, notifyParent);

/**
 * Build a feature with point geom being lon lat
 *
 * @param coords [lon, lat]
 */
function buildFeatureFromCoords(coords: number[]): Proposition {
  return {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: coords,
    },
    properties: {},
  };
}

/** Transforms a point's coordinates (longitude and latitude) into an address with photon */
async function reverseGeocode(lon: number, lat: number) {
  try {
    const response = await photon.reverseGeocodeUserLocation(lon, lat, $language.current!);
    const data = await response.json();

    selectAddress(data.features?.[0] ?? buildFeatureFromCoords([lon, lat]));
  } catch (error) {
    console.warn('Error during reverse geolocation:', error);
    selectAddress(buildFeatureFromCoords([lon, lat]));
  }
}

/** Try to use geolocation from browser */
function useCurrentLocation() {
  if (!navigator.geolocation) {
    toast({
      message: $gettext('Geolocation is not supported by your browser.'),
      type: 'is-warning',
    });
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const coords = [position.coords.longitude, position.coords.latitude];

      localData.coordinates = coords;
      await reverseGeocode(coords[0], coords[1]);
    },
    (error) => {
      console.warn('Geolocation error:', error);
      toast({
        message: $gettext('Unable to get your current location.'),
        type: 'is-warning',
      });
    }
  );
}

/** If the user is authenticated and has entered their address in their profile, it is put in the address field */
async function loadUserAddressIfLoggedIn() {
  if (!$user.isLogged) return;

  try {
    const { data } = await c2c.userProfile.getProfile($user.id!);
    const geom = data.geometry?.geom;
    if (!geom) return;

    const geomData = JSON.parse(geom);
    if (geomData.type !== 'Point' || !geomData.coordinates) return;

    const [x, y] = geomData.coordinates;
    const [lon, lat] = ol.proj.transform([x, y], 'EPSG:3857', 'EPSG:4326');

    localData.coordinates = [lon, lat];
    await reverseGeocode(lon, lat);
  } catch (error) {
    console.warn('Error loading user location:', error);
  }
}

/** Look for address propositions to display them for autocompleting */
function searchAddressPropositions() {
  clearTimeout(searchTimeout);

  if (localData.address?.length < 3) {
    localData.showAddressPropositions = false;
    localData.addressPropositions = [];
    localData.selectedAddress = '';
    return;
  }

  searchTimeout = setTimeout(async () => {
    try {
      const center = props.mapView?.view?.getCenter();
      const centerWgs84 = center ? (ol.proj.toLonLat(center) as [number, number]) : undefined;
      const response = await photon.getPropositions(localData.address, $language.current!, centerWgs84);
      localData.addressPropositions = response.data.features.slice(0, 6) || [];
      localData.showAddressPropositions = localData.addressPropositions?.length > 0;
    } catch (error) {
      console.warn('Error searching for addresses:', error);
      localData.addressPropositions = [];
    }
  }, 600);
}

/** Short delay to allow selection before hiding suggestions */
function handleBlur() {
  setTimeout(() => {
    localData.showAddressPropositions = false;
  }, 200);
}

/** Takes selected address proposition */
function selectAddress(proposition: Proposition) {
  localData.address = formatProposition(proposition);
  localData.selectedAddress = proposition;
  localData.selectedAddress.address = localData.address;
  localData.coordinates = proposition.geometry.coordinates;
  localData.showAddressPropositions = false;
}

onMounted(async () => {
  if (props.defaultAddress === null) {
    // Loads a user's address to put it directly into the 'address' field
    await loadUserAddressIfLoggedIn();
  }
});

onBeforeUnmount(() => {
  clearTimeout(searchTimeout);
});
</script>

<style scoped lang="scss">
.prevent-zoom-on-ios {
  font-size: 16px;
}

.from-container {
  display: flex;
  align-items: center;
  position: relative;
  border: 1px solid #ccc;
  border-radius: 10px;
  background-color: #fff;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

  &:focus-within {
    border-color: #666;
    box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.1);
  }

  .autocomplete-container {
    width: 100%;
    position: relative;

    .from-address {
      width: 100%;
      border: none;
      outline: none;
      background-color: transparent;
      padding: 8px 34px 8px 10px;
      color: #222;
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;

      &::placeholder {
        color: #999;
      }
    }

    .autocomplete-results {
      position: absolute;
      top: calc(100% + 5px);
      left: 0;
      right: 0;
      background-color: #fff;
      border: 1px solid #ddd;
      border-radius: 10px;
      box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
      z-index: 10;
      max-height: 220px;
      overflow-y: auto;
      scrollbar-width: thin;
      scrollbar-color: #aaa #f9f9f9;

      ul {
        list-style: none;
        padding: 0;
        margin: 0;

        li {
          padding: 10px 14px;
          font-size: 14px;
          color: #333;
          transition:
            background 0.2s ease,
            color 0.2s ease;

          &:hover {
            background-color: #f5f5f5;
            cursor: pointer;
            color: #000;
          }

          &:not(:last-child) {
            border-bottom: 1px solid #eee;
          }
        }
      }
    }
  }

  .geolocalisation {
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 10px;
    background-color: white;
    height: 32px;
    width: 32px;
    margin-left: 6px;
    cursor: pointer;
    transition: background 0.2s ease;
    border: 0px;

    &:hover {
      background-color: #efefef;
    }

    .geolocalisation-img {
      height: 16px;
      width: 16px;
    }
  }
}

.fullwidth {
  width: 100%;
}
</style>
