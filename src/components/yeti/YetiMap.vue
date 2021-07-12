<template>
  <div class="column map-container">
    <div style="width: 100%; height: 100%">
      <div ref="map" style="width: 100%; height: 100%" @click="showLayerSwitcher = false" />
      <area-layer :map-zoom="mapZoom" />
      <mountains-layer />
      <yeti-layer :data="yetiData" :extent="yetiExtent" />
      <route-layer :active="activeTab === 0" :features="features" :gpx="gpx" :valid-min-zoom="validMinZoom" />
      <div
        ref="layerSwitcherButton"
        class="ol-control ol-control-layer-switcher-button"
        :title="$gettext('Layers', 'Map controls')"
      >
        <button @click.stop="showLayerSwitcher = !showLayerSwitcher">
          <fa-icon icon="layer-group" />
        </button>
      </div>

      <div v-show="showLayerSwitcher" ref="layerSwitcher" class="ol-control ol-control-layer-switcher" @click.stop="">
        <div>
          <header v-translate>Base layer</header>
          <div v-for="layer of cartoLayers" :key="layer.get('title')" @click="visibleCartoLayer = layer">
            <input :checked="layer == visibleCartoLayer" type="radio" />
            {{ $gettext(layer.get('title'), 'Map layer') }}
          </div>
        </div>
        <div>
          <header v-translate>Slopes</header>
          <div v-for="layer of dataLayers" :key="layer.get('title')" @click="toggleMapDataLayer(layer)">
            <input :checked="layer.getVisible()" type="checkbox" />
            {{ $gettext(layer.get('title'), 'Map slopes layer') }}
          </div>
        </div>
      </div>

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
    </div>
  </div>
</template>

<script>
import { cartoLayers, dataLayers } from '../map/map-layers';

import AreaLayer from './map-layers/AreaLayer.vue';
import MountainsLayer from './map-layers/MountainsLayer.vue';
import RouteLayer from './map-layers/RouteLayer.vue';
import YetiLayer from './map-layers/YetiLayer.vue';

import photon from '@/js/apis/photon';
import ol from '@/js/libs/ol';

const DEFAULT_CENTER = [6.25, 45.15];
const DEFAULT_ZOOM = 6;
const MAX_ZOOM = 19;

export default {
  components: {
    AreaLayer,
    MountainsLayer,
    RouteLayer,
    YetiLayer,
  },
  props: {
    activeTab: {
      type: Number,
      required: true,
    },
    validMinZoom: {
      type: Number,
      required: true,
    },
    mapZoom: {
      type: Number,
      required: true,
    },
    yetiExtent: {
      type: Array,
      required: true,
    },
    yetiData: {
      type: String,
      default: null,
    },
    features: {
      type: Array,
      required: true,
    },
    gpx: {
      type: String,
      default: null,
    },
  },
  data() {
    return {
      cartoLayers: cartoLayers(),
      dataLayers: dataLayers(),

      showLayerSwitcher: false,
      recenterPropositions: null,
      showRecenterOnPropositions: false,

      featuresTitleFromSource: null,
      promiseDocument: null,

      areas: [],
    };
  },
  computed: {
    visibleCartoLayer: {
      get() {
        return this.cartoLayers.find((layer) => layer.getVisible() === true);
      },
      set(layer) {
        this.visibleCartoLayer.setVisible(false);
        layer.setVisible(true);
      },
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

      layers: [
        // c2c layers
        ...this.cartoLayers,
        ...this.dataLayers,
      ],

      view: new ol.View({
        center: ol.proj.transform(DEFAULT_CENTER, 'EPSG:4326', 'EPSG:3857'),
        zoom: DEFAULT_ZOOM,
        maxZoom: MAX_ZOOM,
      }),
    });
  },
  mounted() {
    // when mounted, bind map to element
    this.map.setTarget(this.$refs.map);
    // add specific controls
    let controls = [
      new ol.control.FullScreen({ source: this.$el, tipLabel: this.$gettext('Toggle full-screen', 'Map Controls') }),
      new ol.control.Control({ element: this.$refs.layerSwitcherButton }),
      new ol.control.Control({ element: this.$refs.layerSwitcher }),
      new ol.control.Control({ element: this.$refs.recenterOnControl }),
      new ol.control.Control({ element: this.$refs.recenterOnPropositions }),
    ];
    controls.map((control) => this.map.addControl(control));

    this.view = this.map.getView();

    this.map.on('moveend', this.onMapMoveEnd);
  },
  methods: {
    toggleMapDataLayer(layer) {
      layer.setVisible(!layer.getVisible());
    },
    searchRecenterPropositions(event) {
      const query = event.target.value;

      if (query && query.length >= 3) {
        const center = this.view.getCenter();
        const centerWgs84 = ol.proj.toLonLat(center);

        this.recenterPropositions = photon.getPropositions(query, this.$language.current, centerWgs84);
        this.showRecenterOnPropositions = true;
      }
    },
    recenterOn(item) {
      const feature = new ol.format.GeoJSON().readFeature(item);
      let extent = feature.get('extent');
      let coordinates = feature.getGeometry().flatCoordinates;

      if (extent) {
        extent = ol.proj.transformExtent(extent, 'EPSG:4326', 'EPSG:3857');
        this.view.fit(extent, { size: this.map.getSize(), maxZoom: 12 });
      } else {
        coordinates = ol.proj.transform(coordinates, 'EPSG:4326', 'EPSG:3857');
        this.view.setCenter(coordinates);
        this.view.setZoom(16);
      }

      this.showRecenterOnPropositions = false;
    },
    onMapMoveEnd(event) {
      const mapZoom = Math.floor(event.map.getView().getZoom() * 10) / 10;
      this.$emit('update:mapZoom', mapZoom);
    },
  },
};
</script>

<style scoped lang="scss">
@import '~ol/ol.css';
@import '@/assets/sass/variables.scss';

$control-margin: 0.5em;

.ol-control-layer-switcher {
  bottom: 3em;
  left: $control-margin;
  color: white;
  text-decoration: none;
  background-color: rgba(0, 60, 136, 0.6);
  border: none;
  border-radius: 2px;
  padding: 0 10px 10px 10px;
  display: flex;

  & > div {
    width: 50%;

    &:first-child {
      margin-right: 10px;
    }

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
}

.ol-control-recenter-on-propositions {
  top: 35px;
  left: 3em;
  background: rgba(255, 255, 255, 0.9);
  padding: 5px;

  li:hover {
    background: lightgrey;
    cursor: pointer;
  }
}

$section-padding: 1.5rem; //TODO find this variable
$box-padding: 1.25rem; //TODO find this variable
$header-height: 34px;
$box-margin: 1.5rem; //TODO find this variable
$yeti-height: calc(
  100vh - #{$navbar-height} - #{$section-padding} - 2 *#{$box-padding} - #{$header-height} - #{$box-margin} - #{$box-margin}
);

.map-container {
  position: relative;
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
</style>
