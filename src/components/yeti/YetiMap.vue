<template>
  <div class="column map-container">
    <div style="width: 100%; height: 100%">
      <div ref="map" style="width: 100%; height: 100%" />
      <area-layer />
      <avalanche-bulletins-layer />
      <yeti-layer :data="yetiData" :extent="yetiExtent" />
      <route-layer />
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
          <div v-for="(layer, i) of cartoLayers" :key="layer.get('title')" class="map-control-listitem">
            <input
              :id="'carto-checkbox' + i"
              :checked="layer == visibleCartoLayer"
              type="radio"
              @change="visibleCartoLayer = layer"
            />
            <label :for="'carto-checkbox' + i">{{ $gettext(layer.get('title'), 'Map layer') }}</label>
          </div>
        </div>
        <div>
          <header v-translate>Slopes</header>
          <div v-for="(layer, i) of dataLayers" :key="layer.get('title')" class="map-control-listitem">
            <input
              :id="'data-checkbox' + i"
              :checked="layer.getVisible()"
              type="checkbox"
              @change="toggleMapDataLayer(layer)"
            />
            <label :for="'data-checkbox' + i">{{ $gettext(layer.get('title'), 'Map slopes layer') }}</label>
          </div>
          <header>YETI</header>
          <div v-for="(layer, i) of yetiLayers" :key="layer.title" class="map-control-listitem">
            <input :id="'yeti-checkbox' + i" :checked="layer.checked" type="checkbox" @change="layer.action" />
            <label :for="'yeti-checkbox' + i">{{ layer.title }}</label>
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

      <div ref="drawingMode" class="ol-control ol-control-drawing-mode" :class="{ 'is-primary': drawingMode }">
        <div class="ol-control-drawing-mode-inner">
          <input-checkbox @input="onDrawingMode" :value="drawingMode" :disabled="validSimplifyTolerance">
            <span v-translate title="Enable drawing and editing features on map">Drawing mode</span>
            <span class="yeti-tag">
              <span v-if="validSimplifyTolerance" v-translate>DISABLED</span>
              <span v-else-if="drawingMode">ON</span>
              <span v-else>OFF</span>
            </span>
          </input-checkbox>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { cartoLayers, dataLayers } from '../map/map-layers';

import AreaLayer from './map-layers/AreaLayer.vue';
import AvalancheBulletinsLayer from './map-layers/AvalancheBulletinsLayer.vue';
import RouteLayer from './map-layers/RouteLayer.vue';
import YetiLayer from './map-layers/YetiLayer.vue';

import Yetix from '@/components/yeti/Yetix';
import photon from '@/js/apis/photon';
import ol from '@/js/libs/ol';

const DEFAULT_CENTER = [6.25, 45.15];
const DEFAULT_ZOOM = 6;
const MAX_ZOOM = 19;

export default {
  components: {
    AreaLayer,
    AvalancheBulletinsLayer,
    RouteLayer,
    YetiLayer,
  },
  props: {
    yetiExtent: {
      type: Array,
      required: true,
    },
    yetiData: {
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
    };
  },
  computed: {
    mapZoom() {
      return Yetix.mapZoom;
    },
    showAvalancheBulletins() {
      return Yetix.showAvalancheBulletins;
    },
    showAreas() {
      return Yetix.showAreas;
    },
    drawingMode() {
      return Yetix.drawingMode;
    },
    validSimplifyTolerance() {
      return Yetix.validSimplifyTolerance;
    },
    yetiLayers() {
      return [
        {
          title: this.$gettext('YETI extent'),
          checked: this.showAreas,
          action: this.onShowAreas,
        },
        {
          title: this.$gettext('Avalanche bulletins'),
          checked: this.showAvalancheBulletins,
          action: this.onShowAvalancheBulletins,
        },
      ];
    },
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
  watch: {
    showAvalancheBulletins() {
      this.updateCartoLayersOpacity();
    },
    showAreas() {
      this.updateCartoLayersOpacity();
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
    this.view = this.map.getView();
  },
  mounted() {
    // when mounted, bind map to element
    this.map.setTarget(this.$refs.map);
    // add specific controls
    let controls = [
      new ol.control.FullScreen({ source: this.$el, tipLabel: this.$gettext('Toggle full-screen', 'Map Controls') }),
      new ol.control.Control({ element: this.$refs.layerSwitcherButton }),
      new ol.control.Control({ element: this.$refs.layerSwitcher }),
      new ol.control.Control({ element: this.$refs.drawingMode }),
      new ol.control.Control({ element: this.$refs.recenterOnControl }),
      new ol.control.Control({ element: this.$refs.recenterOnPropositions }),
    ];
    controls.map((control) => this.map.addControl(control));

    // events
    this.map.on('moveend', this.onMapMoveEnd);
    this.map.on('click', this.onMapClick);
  },
  methods: {
    getExtent(projection) {
      let extent = this.view.calculateExtent(this.map.getSize() || null);
      if (projection) {
        extent = ol.proj.transformExtent(extent, ol.proj.get('EPSG:3857'), ol.proj.get(projection));
      }
      return extent;
    },
    toggleMapDataLayer(layer) {
      layer.setVisible(!layer.getVisible());
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
        this.view.fit(extent, { size: this.map.getSize(), maxZoom: 12 });
      } else {
        coordinates = ol.proj.transform(coordinates, 'EPSG:4326', 'EPSG:3857');
        this.view.setCenter(coordinates);
        this.view.setZoom(16);
      }

      this.showRecenterOnPropositions = false;
    },
    getMapZoom() {
      return Math.floor(this.view.getZoom() * 10) / 10;
    },
    onMapMoveEnd() {
      let mapZoom = this.getMapZoom();
      // emit map zoom, only if zoom changed
      if (this.mapZoom !== mapZoom) {
        Yetix.setMapZoom(mapZoom);
      }
      // if mountains are here, update
      if (this.showAvalancheBulletins || this.showAreas) {
        this.updateCartoLayersOpacity();
      }
      // emit an event for map layers
      Yetix.$emit('mapMoveEnd');
    },
    onMapClick(evt) {
      // close controls
      this.showLayerSwitcher = false;
      this.showRecenterOnPropositions = false;
      // emit an event for map layers
      Yetix.$emit('mapClick', evt);
    },
    updateCartoLayersOpacity() {
      const LIMIT_ZOOM = 9;
      this.cartoLayers.forEach((layer) => {
        layer.setOpacity((this.showAvalancheBulletins || this.showAreas) && this.mapZoom < LIMIT_ZOOM ? 0.5 : 1);
      });
    },
    onShowAvalancheBulletins() {
      Yetix.setShowAvalancheBulletins(!this.showAvalancheBulletins);
    },
    onShowAreas() {
      Yetix.setShowAreas(!this.showAreas);
    },
    onDrawingMode() {
      Yetix.setDrawingMode(!this.drawingMode);
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

.ol-control-drawing-mode {
  top: $control-margin;
  left: 18.75rem;
  padding: 0;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2);

  .ol-control-drawing-mode-inner {
    padding: 0.15rem 0.25rem 0;
    border-radius: 4px;
    background: $white;
  }

  &.is-primary .ol-control-drawing-mode-inner {
    background: $primary;
    color: $white;
  }

  .yeti-tag {
    font-size: 0.8em;
    background: rgba(0, 0, 0, 0.25);
    padding: 0.25em;
    border-radius: 2px;
    margin-left: 0.5rem;
    vertical-align: text-top;
  }

  &.is-primary .yeti-tag {
    color: $white;
  }
}

@media screen and (max-width: $widescreen) {
  .ol-control-drawing-mode {
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
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2);
  }
  .ol-control button {
    background: $grey-dark;

    &:hover,
    &:focus {
      background: $grey;
    }
  }

  .ol-attribution {
    max-width: 75%;
  }

  .ol-control-drawing-mode {
    .is-checkradio[type='checkbox'] + label {
      font-size: 0.95em;
      margin-right: 0;
    }
  }
}
</style>
