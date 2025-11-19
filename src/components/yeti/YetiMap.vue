<template>
  <div class="column map-container">
    <div style="width: 100%; height: 100%">
      <yeti-map-legend />
      <div ref="map" style="width: 100%; height: 100%" />
      <map-layers />
      <yeti-layers />
      <overlays-layers />

      <div ref="recenterOnControl" class="ol-control ol-control-recenter-on">
        <input type="text" :placeholder="$gettext('Recenter on...')" @input="searchRecenterPropositions" />
      </div>

      <div
        v-show="showRecenterOnPropositions"
        ref="recenterOnPropositions"
        class="ol-control ol-control-recenter-on-propositions"
      >
        <ul v-if="recenterPropositions && recenterPropositions.data && recenterPropositions.data.features">
          <li v-for="(item, i) of recenterPropositions.data.features" :key="i" @click="recenterOn(item)">
            {{ item.properties.name }},
            <small>{{ item.properties.state }}, {{ item.properties.country }}</small>
          </li>
        </ul>
      </div>

      <div
        ref="centerOnGeolocation"
        :title="$gettext('Recenter on your current position')"
        class="ol-control ol-control-center-on-geolocation"
      >
        <button @click="activateCenterOnGeolocation">
          <fa-icon icon="bullseye" />
        </button>
      </div>

      <div ref="editMode" style="height: 0">
        <edit-mode-button />
      </div>
    </div>
  </div>
</template>

<script>
import MapLayers from './map-layers/MapLayers.vue';
import OverlaysLayers from './map-layers/OverlaysLayers.vue';
import YetiLayers from './map-layers/YetiLayers.vue';

import EditModeButton from '@/components/yeti/EditModeButton';
import YetiMapLegend from '@/components/yeti/YetiMapLegend';
import Yetix from '@/components/yeti/Yetix';
import photon from '@/js/apis/photon';
import ol from '@/js/libs/ol';

const DEFAULT_CENTER = [6.25, 45.15];
const DEFAULT_ZOOM = 6;
const MAX_ZOOM = 19;
const TRACKING_INITIAL_ZOOM = 13;

export default {
  name: 'Yeti',
  components: {
    EditModeButton,
    MapLayers,
    OverlaysLayers,
    YetiLayers,
    YetiMapLegend,
  },
  data() {
    return {
      recenterPropositions: null,
      showRecenterOnPropositions: false,
    };
  },
  computed: {
    mapZoom() {
      return Yetix.mapZoom;
    },
    zoomDelta() {
      return Yetix.ZOOM_DELTA;
    },
  },
  created() {
    // build map
    this.map = new ol.Map({
      controls: [
        new ol.control.Zoom({
          zoomInTipLabel: this.$gettext('Zoom in', 'Map controls'),
          zoomOutTipLabel: this.$gettext('Zoom out', 'Map controls'),
        }),
        new ol.control.ScaleLine(),
        new ol.control.Attribution({ tipLabel: this.$gettext('Attributions', 'Map controls') }),
      ],

      view: new ol.View({
        center: ol.proj.transform(DEFAULT_CENTER, 'EPSG:4326', 'EPSG:3857'),
        zoom: DEFAULT_ZOOM / this.zoomDelta,
        maxZoom: MAX_ZOOM / this.zoomDelta,
        enableRotation: false,
        constrainResolution: true,
        zoomFactor: 2 ** this.zoomDelta,
      }),
    });
    this.view = this.map.getView();

    // if already a stored map position
    if (this.$localStorage.get('yeti-map-position')) {
      let { center, zoom } = this.$localStorage.get('yeti-map-position');
      this.view.setCenter(center);
      this.view.setZoom(zoom / this.zoomDelta);
    }
  },
  mounted() {
    // when mounted, bind map to element
    this.map.setTarget(this.$refs.map);
    // add specific controls
    let controls = [
      new ol.control.FullScreen({ source: this.$el, tipLabel: this.$gettext('Toggle full-screen', 'Map Controls') }),
      new ol.control.Control({ element: this.$refs.editMode }),
      new ol.control.Control({ element: this.$refs.recenterOnControl }),
      new ol.control.Control({ element: this.$refs.recenterOnPropositions }),
      new ol.control.Control({ element: this.$refs.centerOnGeolocation }),
    ];
    controls.map((control) => this.map.addControl(control));

    this.geolocation = new ol.Geolocation({
      trackingOptions: {
        enableHighAccuracy: true,
      },
      projection: this.view.getProjection(),
    });

    // events
    this.map.on('moveend', this.onMapMoveEnd);
    this.map.on('click', this.onMapClick);
    this.map.on('pointermove', this.onMapPointerMove);
    this.geolocation.on('change:position', this.setCenterOnGeoLocation);
  },
  methods: {
    getExtent(projection) {
      let extent = this.view.calculateExtent(this.map.getSize() || null);
      if (projection) {
        extent = ol.proj.transformExtent(extent, ol.proj.get('EPSG:3857'), ol.proj.get(projection));
      }
      return extent;
    },
    searchRecenterPropositions(event) {
      let query = event.target.value;

      if (query && query.length >= 3) {
        let center = this.view.getCenter();
        let centerWgs84 = ol.proj.toLonLat(center);

        this.recenterPropositions = photon.getPropositions(query, this.$language.current, centerWgs84);
        this.showRecenterOnPropositions = true;
      }
    },
    recenterOn(item) {
      let feature = new ol.format.GeoJSON().readFeature(item);
      let extent = feature.get('extent');
      let coordinates = feature.getGeometry().flatCoordinates;

      if (extent) {
        extent = ol.proj.transformExtent(extent, 'EPSG:4326', 'EPSG:3857');
        this.view.fit(extent, { size: this.map.getSize(), maxZoom: 12 / this.zoomDelta });
      } else {
        coordinates = ol.proj.transform(coordinates, 'EPSG:4326', 'EPSG:3857');
        this.view.setCenter(coordinates);
        this.view.setZoom(16 / this.zoomDelta);
      }

      this.showRecenterOnPropositions = false;
    },
    getMapZoom() {
      return Math.round(new ol.View().getZoomForResolution(this.map.getView().getResolution()) * 10) / 10;
    },
    onMapMoveEnd() {
      let mapZoom = this.getMapZoom();
      // emit map zoom, only if zoom changed
      if (this.mapZoom !== mapZoom) {
        Yetix.setMapZoom(mapZoom);
      }
      // emit an event for map layers
      Yetix.$emit('map-moveend');

      // store position
      this.$localStorage.set('yeti-map-position', {
        center: this.map.getView().getCenter(),
        zoom: mapZoom,
      });
    },
    onMapClick(evt) {
      // close controls
      this.showRecenterOnPropositions = false;

      Yetix.$emit('map-click', evt);
    },
    onMapPointerMove(evt) {
      Yetix.$emit('map-pointermove', evt);
    },
    activateCenterOnGeolocation() {
      this.geolocation.setTracking(true);
    },
    setCenterOnGeoLocation() {
      let position = this.geolocation.getPosition();
      this.view.setZoom(TRACKING_INITIAL_ZOOM / this.zoomDelta);
      this.view.setCenter(position);
      this.geolocation.setTracking(false);
    },
  },
};
</script>

<style scoped lang="scss">
@import '~ol/ol.css';
@import '@/assets/sass/variables';

$control-margin: 0.52em;

.ol-control-layer-switcher {
  bottom: 3em;
  left: $control-margin;
  right: $control-margin;
  max-width: 400px;
  text-decoration: none;
  background-color: white;
  border: 1px solid lightgray;
  border-radius: 2px;
  padding: 0 10px 10px 10px;
  display: flex;

  & > div {
    flex: 1;

    header {
      font-weight: bold;
      padding-top: 10px;
    }
  }
}

.ol-control-layer-switcher-button {
  bottom: $control-margin;
  left: $control-margin;
}

.ol-control-recenter-on {
  top: $control-margin;
  left: 3em;
  background: $white;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2);

  input {
    width: 14.75rem;
    border: none;
    padding: 0.3rem;
    border-radius: 2px;
  }
}

.ol-control-recenter-on-propositions {
  top: 35px;
  left: 3em;
  background: white;
  border-radius: 2px;
  border: 1px solid lightgray;
  padding: 5px;

  li:hover {
    background: lightgrey;
    cursor: pointer;
  }
}

.ol-control-center-on-geolocation {
  top: 92px;
  left: $control-margin;
}

.map-control-listitem {
  display: flex;
}
.map-control-listitem label {
  padding-left: 0.25rem;
}

$section-padding: 1.5rem; //TODO find this variable
$box-padding: 1.25rem; //TODO find this variable
$header-height: 34px;
$box-margin: 1.5rem; //TODO find this variable
$yeti-height: calc(
  100vh - #{$navbar-height} - #{$section-padding} - 2 * #{$box-padding} - #{$header-height} - #{$box-margin} - #{$box-margin}
);

.map-container {
  position: relative;
  padding-left: 0;
}
@media screen and (max-width: $tablet) {
  .map-container {
    height: $yeti-height;
    padding-left: 0;
    padding-top: 0;
    padding-bottom: 0;
  }
}

@media screen and (min-width: $tablet) {
  .yeti-content {
    .map-container {
      min-height: 100%;
    }
  }
}

.ol-control-edit-mode {
  top: $control-margin;
  left: 18.75rem;
}

@media screen and (max-width: $widescreen) {
  .ol-control-edit-mode {
    top: 3rem;
    left: 3rem;
  }
}

.icon-notification {
  color: $primary;
}
</style>

<style lang="scss">
.yeti-app {
  .ol-control {
    background: $white;
    padding: 2px;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2);
  }
  .ol-control button {
    background: $grey-dark;
    color: $white;

    &:hover,
    &:focus {
      background: $grey;
      outline: none;
    }
  }
  .ol-control > * {
    line-height: 1;
  }

  .ol-attribution {
    max-width: 75%;
  }
}
</style>
