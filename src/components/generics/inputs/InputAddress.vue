<template>
  <div :class="['control', { fullwidth: fullwidth }]">
    <div class="from-container">
      <div class="autocomplete-container">
        <input
          class="from-address"
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
      <button class="geolocalisation" @click="useCurrentLocation">
        <img class="geolocalisation-img" src="@/assets/img/boxes/geoloc.svg" alt="geoloc" />
      </button>
    </div>
  </div>
</template>

<script>
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
      default: 'Entrez une adresse',
    },
    showAddressPropositions: {
      type: Boolean,
      default: false,
    },
    mapView: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      localData: {
        address: '',
        selectedAddress: '',
        addressPropositions: '',
        showAddressPropositions: this.showAddressPropositions,
        coordinates: null,
      },
    };
  },
  watch: {
    'localData.selectedAddress'() {
      this.notifyParent();
    },
  },
  async mounted() {
    // Loads a user's address to put it directly into the 'address' field
    await this.loadUserAddressIfLoggedIn();

    // Firefox's date picker calendar has a specific design
    if (navigator.userAgent.toLowerCase().includes('firefox')) {
      document.documentElement.classList.add('is-firefox');
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
              const response = await fetch(
                `https://photon.komoot.io/reverse?lon=${coords[0]}&lat=${coords[1]}&lang=${this.$language.current}`
              );
              const data = await response.json();

              if (data.features && data.features.length > 0) {
                const location = data.features[0];
                this.selectAddress(location);
              }
            } catch (error) {
              console.error('Error during reverse geolocation:', error);
              this.localData.address = `${coords[1]}, ${coords[0]}`;
            }
          },
          (error) => {
            console.error('Geolocation error:', error);
            alert('Unable to get your current location.');
          }
        );
      } else {
        alert('Geolocation is not supported by your browser.');
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
          console.error('Error searching for addresses:', error);
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
      this.notifyParent();
    },

    /** Format address proposition rendered by Photon */
    formatProposition(proposition) {
      const props = proposition.properties;
      let formattedAddress = props.name || '';

      if (props.housenumber) {
        formattedAddress = `${formattedAddress} ${props.housenumber}`;
      }

      if (props.street) {
        formattedAddress = `${formattedAddress}${' '}${props.street}`;
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
        console.error('Error loading user location:', error);
      }
    },

    /** Transforms a point's coordinates (longitude and latitude) into an address with photon */
    async reverseGeocodeUserLocation(lon, lat) {
      try {
        const response = await fetch(
          `https://photon.komoot.io/reverse?lon=${lon}&lat=${lat}&lang=${this.$language.current}`
        );
        const data = await response.json();

        if (data.features && data.features.length > 0) {
          const location = data.features[0];
          this.localData.address = this.formatProposition(location);
          this.localData.selectedAddress = location;
        } else {
          this.localData.address = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        }
      } catch (error) {
        console.error('Error during reverse geolocation:', error);
        this.localData.address = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      }
    },
  },
};
</script>

<style scoped lang="scss">
.from-container {
  display: flex;
  border: 1px solid lightgray;
  padding: 5px;
  border-radius: 4px;
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
}

.fullwidth {
  width: 100%;
}
</style>
