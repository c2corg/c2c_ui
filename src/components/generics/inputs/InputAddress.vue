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

<script>
import { toast } from 'bulma-toast';

import { default as c2c } from '@/js/apis/c2c';
import photon from '@/js/apis/photon';
import ol from '@/js/libs/ol';

export default {
  props: {
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
  },
  data() {
    return {
      localData: {
        address: this.defaultAddress ? this.formatProposition(this.defaultAddress) : '',
        selectedAddress: '',
        addressPropositions: [],
        showAddressPropositions: this.showAddressPropositions,
        coordinates: null,
      },
    };
  },
  computed: {
    isIos() {
      const ua = navigator.userAgent || '';
      const platform = navigator.platform || '';
      // Old iPhones/iPads/iPods
      if (/iPad|iPhone|iPod/i.test(ua) || /iPad|iPhone|iPod/i.test(platform)) return true;
      // iPadOS 13+ reports MacIntel but has touch points > 1
      if (platform === 'MacIntel' && navigator.maxTouchPoints > 1) return true;
      return false;
    },
  },
  watch: {
    'localData.selectedAddress'() {
      this.notifyParent();
    },
  },
  async mounted() {
    if (this.defaultAddress === null) {
      // Loads a user's address to put it directly into the 'address' field
      await this.loadUserAddressIfLoggedIn();
    }
  },
  beforeDestroy() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  },
  methods: {
    notifyParent() {
      this.$emit('update:props', this.localData.selectedAddress);
    },
    /** Takes current location and use reverse query with Photon to get location name */
    useCurrentLocation() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const coords = [position.coords.longitude, position.coords.latitude];
            this.localData.coordinates = coords;

            try {
              const response = await photon.reverseGeocodeUserLocation(coords[0], coords[1], this.$language.current);

              const data = await response.json();

              if (data.features && data.features.length > 0) {
                const location = data.features[0];
                this.selectAddress(location);
              } else {
                // fallback
                this.selectAddress({
                  geometry: {
                    coordinates: coords,
                    type: 'Point',
                  },
                  properties: {},
                  type: 'Feature',
                });
              }
            } catch (error) {
              console.warn('Error during reverse geolocation:', error);
              this.selectAddress({
                geometry: {
                  coordinates: coords,
                  type: 'Point',
                },
                properties: {},
                type: 'Feature',
              });
            }
          },
          (error) => {
            console.warn('Geolocation error:', error);
            toast({ message: this.$gettext('Unable to get your current location.'), type: 'is-warning' });
          }
        );
      } else {
        toast({ message: this.$gettext('Geolocation is not supported by your browser.'), type: 'is-warning' });
      }
    },
    /** Address auto-complete, launched when the user has not typed anything for 0.6 seconds */
    async searchAddressPropositions() {
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout);
      }

      if (this.localData.address?.length < 3) {
        this.localData.showAddressPropositions = false;
        this.localData.addressPropositions = [];
        this.localData.selectedAddress = '';
        return;
      }

      this.searchTimeout = setTimeout(async () => {
        try {
          const center = this.mapView?.view?.getCenter();
          const centerWgs84 = center ? ol.proj.toLonLat(center) : null;
          const response = await photon.getPropositions(this.localData.address, this.$language.current, centerWgs84);
          this.localData.addressPropositions = response.data.features.slice(0, 6) || [];
          this.localData.showAddressPropositions = this.localData.addressPropositions?.length > 0;
        } catch (error) {
          console.warn('Error searching for addresses:', error);
          this.localData.addressPropositions = [];
        }
      }, 600);
    },

    /** Short delay to allow selection before hiding suggestions */
    handleBlur() {
      setTimeout(() => {
        this.localData.showAddressPropositions = false;
      }, 200);
    },

    /** Takes selected address proposition */
    selectAddress(proposition) {
      this.localData.selectedAddress = proposition;
      this.localData.address = this.formatProposition(proposition);
      this.localData.coordinates = proposition.geometry.coordinates;
      this.localData.showAddressPropositions = false;
    },

    /** Format address proposition rendered by Photon */
    formatProposition(proposition) {
      const props = proposition.properties;
      if (Object.keys(props).length === 0) {
        return `${proposition.geometry.coordinates[0].toFixed(4)}, ${proposition.geometry.coordinates[1].toFixed(4)}`;
      }

      let formattedAddress = props.name || '';

      if (props.housenumber) {
        formattedAddress = `${formattedAddress} ${props.housenumber}`;
      }

      if (props.street) {
        formattedAddress = `${formattedAddress} ${props.street}`;
      }

      if (props.city) {
        formattedAddress = `${formattedAddress}${formattedAddress ? ', ' : ''}${props.city}`;
      }

      if (props.postcode) {
        formattedAddress = `${formattedAddress} ${props.postcode}`;
      }

      if (props.country) {
        formattedAddress = `${formattedAddress}${formattedAddress ? ', ' : ''}${props.country}`;
      }

      return formattedAddress;
    },
    /** If the user is authenticated and has entered their address in their profile, it is put in the address field */
    async loadUserAddressIfLoggedIn() {
      if (!this.$user.isLogged) {
        return;
      }

      try {
        const profileResponse = await c2c.userProfile.getProfile(this.$user.id);
        const profileData = profileResponse.data;

        if (profileData.geometry && profileData.geometry.geom) {
          const geomData = JSON.parse(profileData.geometry.geom);

          if (geomData.type === 'Point' && geomData.coordinates) {
            const [x, y] = geomData.coordinates;
            const [lon, lat] = ol.proj.transform([x, y], 'EPSG:3857', 'EPSG:4326');
            this.localData.coordinates = [lon, lat];

            await this.reverseGeocodeUserLocation(lon, lat);
          }
        }
      } catch (error) {
        console.warn('Error loading user location:', error);
      }
    },

    /** Transforms a point's coordinates (longitude and latitude) into an address with photon */
    async reverseGeocodeUserLocation(lon, lat) {
      try {
        const response = await photon.reverseGeocodeUserLocation(lon, lat, this.$language.current);

        const data = await response.json();

        if (data.features && data.features.length > 0) {
          const location = data.features[0];
          this.localData.address = this.formatProposition(location);
          this.localData.selectedAddress = location;
        } else {
          this.localData.address = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        }
      } catch (error) {
        console.warn('Error during reverse geolocation:', error);
        this.localData.address = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      }
    },
  },
};
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
          transition: background 0.2s ease, color 0.2s ease;

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
