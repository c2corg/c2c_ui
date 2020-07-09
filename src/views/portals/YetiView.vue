<template>
  <!-- eslint-disable no-irregular-whitespace -->
  <div class="section">
    <html-header title="Yeti" />
    <div class="box">
      <h1 class="title is-1">
        <div class="yeti-icon is-inline-block">
          <icon-yeti />
        </div>
        <span>YETI - Un outil de préparation de course</span>
      </h1>
    </div>

    <div class="yeti-app">
      <div class="box yeti-disclaimer" v-if="showDisclaimer">
        <h2 class="title is-3 yeti-title">Avertissement</h2>
        <yeti-text component="disclaimer" />
        <form action="#" @submit="onSubmitDisclaimer">
          <input-checkbox v-model="checkDisclaimer">
            J’ai lu et j’ai compris l’intérêt et les limites de Yéti
          </input-checkbox>
          <button class="button is-primary" :disabled="!checkDisclaimer">Accéder à YETI</button>
        </form>
      </div>

      <div class="box" v-if="$route.params.page === 'faq'">
        <p><router-link to="/yeti">Retour YETI</router-link></p>
        <h2 class="title is-3 yeti-title">Avertissement</h2>
        <yeti-text component="disclaimer" />
        <h2 class="title is-3 yeti-title">FAQ</h2>
        <yeti-text component="faq" />
      </div>

      <div class="columns yeti-content" v-else>
        <div class="column is-6-tablet is-6-desktop is-5-widescreen is-4-fullhd form-container">
          <div class="box">
            <div class="columns">
              <div class="column">
                <router-link class="is-size-6 is-pulled-right" to="/yeti/faq">FAQ ?</router-link>
              </div>
            </div>
            <yetiPanel class="is-relative">
              <validation-button
                class="is-hidden-mobile yeti-validation--top"
                :current-error="currentError"
                :loading="promise"
                @click="compute"
              />
              <yetiSubPanel>
                Info <abbr title="Bulletin d’estimation du risque d’avalanche">BRA</abbr>
                <template #content>
                  <panelBRA :bra.sync="bra" :map="yetiMap" />
                </template>
              </yetiSubPanel>
              <yetiSubPanel>
                Méthodes
                <template #content>
                  <panelMethodes :method.sync="method" :bra="bra" @warnAboutMethodBra="warnAboutMethodBra" />
                </template>
              </yetiSubPanel>
              <validation-button
                v-show="method.type"
                class="yeti-validation--bottom"
                :current-error="currentError"
                :loading="promise"
                @click="compute"
              />
            </yetiPanel>
          </div>

          <div class="box is-hidden-mobile" v-if="document">
            <div class="title is-4 document-title">Route</div>
            <document-link :document="document">
              <icon-route class="document-icon" />
              <document-title :document="document" />
            </document-link>
          </div>

          <div class="box yeti-logos">
            <div class="columns is-mobile is-vcentered">
              <div class="column has-text-centered">
                <a href="http://www.ensg.eu">
                  <picture>
                    <source srcset="@/assets/img/yeti/logo-ensg.webp" type="image/webp" />
                    <source srcset="@/assets/img/yeti/logo-ensg.avif" type="image/avif" />
                    <img src="@/assets/img/yeti/logo-ensg.jpg" alt="Logo ENSG" width="120" />
                  </picture>
                </a>
              </div>
              <div class="column has-text-centered">
                <a href="https://www.petzl.com/fondation/fondation-petzl?language=fr">
                  <picture>
                    <source srcset="@/assets/img/yeti/logo-fondation-petzl.webp" type="image/webp" />
                    <source srcset="@/assets/img/yeti/logo-fondation-petzl.avif" type="image/avif" />
                    <img src="@/assets/img/yeti/logo-fondation-petzl.jpg" alt="Logo Fondation Petzl" width="90" />
                  </picture>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div class="column map-container">
          <div class="legend">
            <div>
              <div class="legend-button is-pulled-right ol-control">
                <button type="button" @click="showLegend = !showLegend"><span>Légende</span></button>
              </div>
            </div>
            <div class="legend-content" v-show="showLegend === true">
              <p class="is-italic" v-if="!mapLegend">La légende apparaitra automatiquement avec l’image générée</p>
              <div v-else>
                <ul>
                  <li v-for="(item, i) of mapLegend.items" :key="i">
                    <span class="legend-color" :style="'background:' + item.color" />
                    <span>{{ item.text['fr'] }}</span>
                  </li>
                </ul>
                <p class="is-size-6 is-italic">{{ mapLegend.comment['fr'] }}</p>
              </div>
            </div>
          </div>
          <div class="ol-control opacity" v-if="yetiLayer">
            <div class="opacity-slider">
              <vue-slider
                v-model="opacityYetiLayer"
                :min="0"
                :max="1"
                :interval="0.01"
                tooltip="none"
                direction="btt"
                :rail-style="{ background: 'rgba(0,0,0,.25)' }"
                :process-style="{ background: 'white' }"
                @change="onUpdateOpacityYetiLayer"
              />
            </div>
          </div>
          <map-view ref="map" show-recenter-on :documents="documents" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import vueSlider from 'vue-slider-component';

import panelBRA from '@/components/yeti/PanelBRA';
import panelMethodes from '@/components/yeti/PanelMethodes';
import yetiText from '@/components/yeti/Text';
import ValidationButton from '@/components/yeti/ValidationButton';
import yetiPanel from '@/components/yeti/YetiPanel';
import yetiSubPanel from '@/components/yeti/YetiSubPanel';
import c2c from '@/js/apis/c2c';
import ol from '@/js/libs/ol';

const YETI_URL_BASE =
  'https://api.ensg.eu/yeti-wps?request=Execute&service=WPS&version=1.0.0&identifier=Yeti&datainputs=';
const YETI_URL_AREAS = 'https://api.ensg.eu/yeti-extent';

const YETI_ATTRIBUTION = 'Données RGE ALTI®';

const VALID_FORM_DATA = {
  minZoom: 13,
  braMaxMrd: 3,
};

const OPACITY_LAYER = 0.75;

const ERRORS = {
  area: {
    simple: 'Zone non couverte',
    full:
      'L’emprise actuelle de la carte n’est pas couverte par YETI. Seuls les massifs montagneux français le sont (délimités par des pointillés).',
  },
  method: {
    simple: 'Méthode manquante',
    full: 'Veuillez sélectionner une méthode pour le calcul.',
  },
  method_bra: {
    simple: 'Méthode et BRA incompatible',
    full: 'La méthode MRD (débutant) est autorisée avec un BRA de 3 maximum. Choisissez la méthode MRE ou MRP.',
  },
  bra: {
    simple: 'BRA manquant',
    full: 'La valeur de BRA est manquante. Veuillez saisir la valeur spécifiée par le bulletin Météo-France.',
  },
  altitude: {
    simple: 'Altitude manquante',
    full:
      'L’altitude est requise quand le BRA haut et bas sont différents. Précisez la valeur fournie par le bulletin Météo-France.',
  },
  zoom: {
    simple: 'Zoom carte trop important',
    full: 'L’emprise actuelle est trop grande. Veuillez zoomer au niveau ' + VALID_FORM_DATA.minZoom + ' minimum.',
  },
  ok: 'Tout semble OK ! :)',
  yeti: 'Le service ne fonctionne pas actuellement',
  yeti_prefix: 'YETI Service: ',
  yeti_unauthorized:
    'Vous devez être autorisé pour effectuer cette requête. Contactez les administrateurs du service si vous êtes intéressé.',
};

export default {
  name: 'Yeti',

  components: { vueSlider, ValidationButton, yetiText, yetiPanel, yetiSubPanel, panelBRA, panelMethodes },

  data() {
    return {
      showDisclaimer: false,
      checkDisclaimer: false,

      yetiMap: null,

      bra: {
        high: null,
        low: null,
        altiThreshold: null,
        isDifferent: false,
      },
      method: {
        type: null,
        orientation: [],
        potentialDanger: undefined,
        wetSnow: false,
        groupSize: 1,
      },

      mapZoom: false,
      formError: undefined,
      currentError: undefined,

      promise: null,
      yetiLayer: null,
      opacityYetiLayer: OPACITY_LAYER,
      showLegend: undefined,
      mapLegend: null,
      extentLayer: null,

      promiseDocument: null,

      areas: {},
      areasLayer: null,
      areaOK: true,
    };
  },

  computed: {
    mrdIsNotApplicable() {
      return this.isBraMax && this.method.type === 'mrd';
    },

    isBraMax() {
      return this.bra.high > VALID_FORM_DATA.braMaxMrd || this.bra.low > VALID_FORM_DATA.braMaxMrd;
    },

    isValidMapZoom() {
      return this.mapZoom >= VALID_FORM_DATA.minZoom;
    },

    document() {
      return this.promiseDocument && this.promiseDocument.data ? this.promiseDocument.data : null;
    },

    documents() {
      return this.document ? [this.document] : null;
    },

    areasLayerStyle() {
      const levelStrokeWidth = 2;
      const levelStrokeOpacity = 4;
      const lineWidthStroke = Math.max(0, Math.min(this.mapZoom - 6, levelStrokeWidth));
      const opacityStroke = Math.max(0, Math.min(this.mapZoom - 6, levelStrokeOpacity)) / 4;
      const lineDashStroke = opacityStroke * 6;

      return new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'hsla(30, 100%, 40%,' + opacityStroke + ')',
          width: lineWidthStroke,
          lineDash: [lineDashStroke],
        }),
      });
    },
  },

  watch: {
    'bra.low': 'check',
    'bra.altiThreshold': 'check',
    'bra.isDifferent': 'check',
    'method.type': 'check',
    'method.potentialDanger': 'check',
    mapZoom: 'check',
    areaOK: 'check',
  },

  created() {
    // show disclaimer if not already validated
    if (!this.$localStorage.get('yeti-disclaimer')) {
      this.showDisclaimer = true;
    }
  },

  mounted() {
    // yeti app is loaded: store yetiMap
    this.yetiMap = this.$refs.map;

    this.check();

    // document
    const doc = this.$route.params.document_id;
    const lang = this.$language.current;
    if (doc) {
      this.promiseDocument = c2c['route'].getCooked(doc, lang).then(this.onDocument);
    }

    // area ok?
    this.$refs.map.map.on('moveend', this.onMapMoveEnd);
    axios.get(YETI_URL_AREAS).then(this.onAreasResult);
  },

  methods: {
    check() {
      if (!this.isValidMapZoom) {
        this.formError = 'zoom';
      } else if (!this.areaOK) {
        this.formError = 'area';
      } else if (!this.bra.high) {
        this.formError = 'bra';
      } else if (this.bra.low && this.bra.high !== this.bra.low && !this.bra.altiThreshold) {
        this.formError = 'altitude';
      } else if (!this.method.type) {
        this.formError = 'method';
      } else if (this.mrdIsNotApplicable) {
        this.formError = 'method_bra';
      } else if (this.bra.isDifferent && (!this.bra.low || !this.bra.high)) {
        this.formError = 'bra';
      } else {
        this.formError = null;
      }
      // also
      // verif if bra = 4, method MRD forbidden
      if (this.mrdIsNotApplicable) {
        this.method.type = null;
      }

      // then set errors
      this.setCurrentError();
    },

    warnAboutMethodBra(item) {
      if (item === 'mrd' && this.isBraMax) {
        window.alert(ERRORS.method_bra.full);
      }
    },

    setCurrentError() {
      if (this.formError) {
        this.currentError = ERRORS[this.formError]['simple'];
        if (this.formError === 'zoom') {
          this.currentError += ' (actuel: ' + this.mapZoom + ' sur ' + VALID_FORM_DATA.minZoom + ')';
        }
      } else {
        this.currentError = ERRORS['ok'];
      }
    },

    compute() {
      if (this.formError) {
        window.alert(ERRORS[this.formError]['full']);
        return;
      }

      const extent = this.$refs.map.getExtent('EPSG:3857');
      const extendedExtent = this.extendExtent(extent);

      const yetiUrl = this.getYetiUrl(extendedExtent);

      // remove old layers first
      this.removeLayers();

      // fetch img
      this.promise = axios
        .get(yetiUrl)
        .then((result) => this.onYetiResult(result, extendedExtent))
        .catch(this.onYetiError);
    },

    removeLayers() {
      if (this.yetiLayer) {
        this.yetiLayer.setMap(null);
        this.yetiLayer = null;

        // set default opacity
        this.opacityYetiLayer = OPACITY_LAYER;
      }
      if (this.extentLayer) {
        this.extentLayer.setMap(null);
        this.extentLayer = null;
      }
    },

    toLinearRing(extent) {
      const minX = extent[0];
      const minY = extent[1];
      const maxX = extent[2];
      const maxY = extent[3];
      return [
        [minX, minY],
        [minX, maxY],
        [maxX, maxY],
        [maxX, minY],
        [minX, minY],
      ];
    },

    drawExtent(extent) {
      // extend extent
      const extentFill = ol.extent.buffer(extent, Math.max(extent[2] - extent[0], extent[3] - extent[1]) / 10);
      // then, create a donut polygon
      const polygon = new ol.Feature(new ol.geom.Polygon([this.toLinearRing(extentFill), this.toLinearRing(extent)]));
      // create extent layer
      this.extentLayer = new ol.layer.Vector({
        source: new ol.source.Vector({
          features: [polygon],
        }),
        style: [
          new ol.style.Style({
            fill: new ol.style.Fill({ color: 'hsla(30, 100%, 60%, .45)' }),
          }),
          new ol.style.Style({
            stroke: new ol.style.Stroke({ color: 'hsla(30, 100%, 40%, 1)', width: 2 }),
            geometry: (feature) => {
              return new ol.geom.Polygon([feature.getGeometry().getCoordinates()[1]]);
            },
          }),
        ],
      });
      this.extentLayer.setMap(this.$refs.map.map);
    },

    extendExtent(extent) {
      const extendedFactor = Math.min(0.5, (this.mapZoom - VALID_FORM_DATA.minZoom) / 6);
      const extendedValue = Math.max(extent[2] - extent[0], extent[3] - extent[1]) * extendedFactor;
      return ol.extent.buffer(extent, extendedValue);
    },

    onYetiResult(result, extendedExtent) {
      const xml = new DOMParser().parseFromString(result.data, 'application/xml');
      const imageBase64 = xml.getElementsByTagName('wps:ComplexData')[0].textContent;
      const imageBbox = xml.getElementsByTagName('wps:ComplexData')[1].textContent;
      const imageExtent = ol.proj.transformExtent(imageBbox.split(',').map(Number), 'EPSG:4326', 'EPSG:3857');

      this.drawExtent(extendedExtent);

      this.yetiLayer = new ol.layer.Image({
        source: new ol.source.ImageStatic({
          url: '',
          imageLoadFunction(image) {
            image.getImage().src = 'data:image/png;base64,' + imageBase64;
          },
          imageExtent,
          attributions: YETI_ATTRIBUTION,
        }),
        opacity: this.opacityYetiLayer,
      });

      this.yetiLayer.setMap(this.$refs.map.map);

      // put yeti layer below document layers
      this.yetiLayer.setZIndex(0);

      // set map legend
      this.mapLegend = JSON.parse(xml.getElementsByTagName('wps:ComplexData')[2].textContent);
      this.mapLegend.items.forEach((item) => {
        item.color = `rgb(${item.color[0]}, ${item.color[1]}, ${item.color[2]})`;
      });

      this.promise = null;
    },

    onYetiError(err) {
      this.promise = null;

      let errorText = ERRORS['yeti'];

      if (err.response.status === 400) {
        const xml = new DOMParser().parseFromString(err.response.data, 'text/xml');
        errorText = [...xml.getElementsByTagName('ExceptionText')].map((_) => _.textContent).join(' ');
      }

      if (err.response.status === 403) {
        errorText = ERRORS['yeti_unauthorized'];
      }

      window.alert(ERRORS['yeti_prefix'] + errorText);
    },

    onUpdateOpacityYetiLayer() {
      if (this.yetiLayer) {
        this.yetiLayer.setOpacity(this.opacityYetiLayer);
        this.yetiLayer.setMap(this.$refs.map.map);
      }
    },

    getYetiUrl(extent) {
      // project extent
      const bbox = ol.proj.transformExtent(extent, 'EPSG:3857', 'EPSG:4326');

      // set bra.low / altiThreshold
      const braLow = this.bra.isDifferent ? this.bra.low : this.bra.high;
      const braAltiThreshold = this.bra.isDifferent ? this.bra.altiThreshold : 0;

      // mre
      const compass =
        this.method.type === 'mre' && this.method.orientation.length !== 0
          ? 'none,' + this.method.orientation.join(',').toLowerCase()
          : 'none';

      // mrp
      const potentialDanger = this.method.type === 'mrp' ? this.method.potentialDanger : 0;
      const wetSnow = this.method.type === 'mrp' ? this.method.wetSnow : false;
      const groupSize = this.method.type === 'mrp' ? Math.floor(this.method.groupSize) : 0;

      // create url
      let result = YETI_URL_BASE;
      result += `methode=${this.method.type};`;
      result += `bbox=${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]};`;
      result += `risque_haut=${this.bra.high};`;
      result += `risque_bas=${braLow};`;
      result += `seuil_alti=${braAltiThreshold};`;
      result += `rdv=${compass};`;
      result += `potentiel_danger=${potentialDanger};`;
      result += `neige_mouillee=${wetSnow};`;
      result += `taille_groupe=${groupSize}`;

      return result;
    },

    onMapMoveEnd(event) {
      this.mapZoom = Math.floor(event.map.getView().getZoom() * 10) / 10;
      this.setVisibleAreas();
    },

    onSubmitDisclaimer() {
      this.showDisclaimer = false;
      this.$localStorage.set('yeti-disclaimer', 'validated');
    },

    onDocument() {
      // set min zoom for map
      // (that will be used after document is displayed and map is fitted to extent)
      this.$refs.map.minZoomLevel = VALID_FORM_DATA.minZoom;
      // put document layers on top
      ['documentsLayer', 'waypointsLayer'].forEach((layer) => {
        this.$refs.map[layer].setZIndex(1);
      });
    },

    onAreasResult(data) {
      const areas = data.data;
      const rawFeatures = new ol.format.GeoJSON().readFeatures(areas);
      // geojson is 4326, convert to 3857
      rawFeatures[0].getGeometry().transform('EPSG:4326', 'EPSG:3857');

      this.areas = rawFeatures.map((area) => {
        return area.getProperties();
      });

      // flatten coords
      const rawCoords = rawFeatures[0].getGeometry().getCoordinates();
      const coords = [];
      for (let i = 0; i < rawCoords.length; i++) {
        coords.push(...rawCoords[i]);
      }
      // then, build linestrings instead of polygon (perf)
      const features = [];
      for (let i = 0; i < coords.length; i++) {
        for (let j = 0; j < coords[i].length - 1; j++) {
          features.push(new ol.Feature(new ol.geom.LineString([coords[i][j], coords[i][j + 1]])));
        }
      }

      // create layer
      this.areasLayer = new ol.layer.Vector({
        renderMode: 'image',
        source: new ol.source.Vector({
          features,
        }),
        style: this.areasLayerStyle,
      });
      this.areasLayer.setMap(this.$refs.map.map);
    },

    setVisibleAreas() {
      const mapExtent = this.$refs.map.getExtent('EPSG:3857');

      for (const area in this.areas) {
        const polygon = this.areas[area].geometry;
        if (polygon.intersectsExtent(mapExtent)) {
          this.areaOK = true;
          break;
        } else {
          this.areaOK = false;
        }
      }

      // update style
      if (this.areasLayer) {
        // YETI_URL_AREAS can fail
        this.areasLayer.setStyle(this.areasLayerStyle);
      }
    },
  },
};
</script>

<style scoped lang="scss">
$section-padding: 1.5rem; //TODO find this variable
$box-padding: 1.25rem; //TODO find this variable
$header-height: 34px;
$box-margin: 1.5rem; //TODO find this variable
$yeti-height: calc(
  100vh - #{$navbar-height} - #{$section-padding} - 2 *#{$box-padding} - #{$header-height} - #{$box-margin} - #{$box-margin}
);

.yeti-app {
  position: relative;
}

.yeti-icon {
  transform: scale(0.9);
}

.map-container {
  position: relative;

  .legend {
    position: absolute;
    z-index: 6;
    top: 1.25rem;
    right: 1.25rem;

    .legend-button {
      position: static;

      button {
        width: auto;
        padding: 0 0.5em;
      }
    }

    .legend-content {
      margin-top: 0.5rem;
      margin-left: 1.25rem;
      border-radius: 2px;
      border: 1px solid lightgray;
      padding: 0.5rem;
      background: white;
      clear: both;
    }

    .legend-color {
      vertical-align: bottom;
      display: inline-block;
      width: 21px;
      height: 21px;
      margin-right: 5px;
    }
  }

  .opacity {
    position: absolute;
    z-index: 5;
    top: 3.5rem;
    right: 1.25rem;

    .opacity-slider {
      font-size: 1.14em;
      margin: 1px;
      width: 1.375em;
      padding: 1rem 0;
      background: rgba(0, 60, 136, 0.5);
      border-radius: 2px;

      &:hover {
        background: rgba(0, 60, 136, 0.7);
      }
    }

    .vue-slider {
      padding: 0 9px !important;
      height: 300px !important;
      max-height: 30vh;
    }

    .vue-slider-process {
      background: $white;
    }

    .vue-slider-rail {
      background: $black;
    }
  }
}
@media screen and (max-width: $tablet) {
  .map-container {
    height: $yeti-height;
    padding-left: 0;
    padding-top: 0;
    padding-bottom: 0;

    .legend {
      top: 0.5rem;

      .legend-content {
        margin-left: 0.5rem;
      }
    }

    .opacity {
      top: 2.75rem;
    }
  }

  .mobile-result-map {
    margin-top: 0;
    height: $yeti-height;

    .documents-container {
      display: None;
    }
  }

  .mobile-result-card {
    .map-container {
      visibility: hidden; // map does not like to be in a display none...
    }
  }
}

@media screen and (min-width: $tablet) {
  .yeti-content {
    height: $yeti-height;

    .form-container {
      height: 100%;
      overflow: auto;
    }

    .map-container {
      min-height: 100%;
    }
  }
}

.yeti-validation--top {
  position: absolute;
  right: 0;
  top: 0.75rem;
  width: 50%;
  z-index: 1;
}

.yeti-validation--bottom {
  margin-top: 1rem;
}

.yeti-logos {
  box-shadow: none;
  background: none;
  mix-blend-mode: multiply;

  img {
    max-width: 65%;
  }
}

.yeti-disclaimer {
  position: absolute;
  z-index: 10;
  top: 0.75rem;
  right: 0;
  left: 0;
  min-height: 100%;

  & + .yeti-content {
    visibility: hidden;
  }
}

.document-title {
  margin-bottom: 0.5rem !important;
}

.document-icon,
.document-icon:hover {
  color: $dark;
  margin-right: 3px;
}
</style>

<style lang="scss">
/* Not scoped styles */
.yeti-app {
  .input-orientation {
    width: 120px;
    height: 120px;
  }
}
</style>
