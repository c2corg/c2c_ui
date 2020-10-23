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
      <div class="box yeti-overlay" v-if="showDisclaimer">
        <h2 class="title is-3 yeti-title">Avertissement</h2>
        <texts component="disclaimer" />
        <form action="#" @submit="onSubmitDisclaimer">
          <input-checkbox v-model="checkDisclaimer">
            J’ai lu et j’ai compris l’intérêt et les limites de Yéti
          </input-checkbox>
          <button class="button is-primary" :disabled="!checkDisclaimer">Accéder à YETI</button>
        </form>
      </div>

      <div class="box yeti-overlay" v-if="$route.params.page === 'faq'">
        <p><router-link to=".">Retour YETI</router-link></p>
        <h2 class="title is-3 yeti-title">Avertissement</h2>
        <texts component="disclaimer" />
        <h2 class="title is-3 yeti-title">FAQ</h2>
        <texts component="faq" />
      </div>

      <div class="columns yeti-content">
        <div class="column is-6-tablet is-6-desktop is-5-widescreen is-4-fullhd form-container">
          <div class="columns mb-0 yeti-columns--reverse is-mobile">
            <ul class="column is-narrow pb-0">
              <li>
                <router-link class="is-block yetitabs-link" :to="$route.fullPath + '/faq'">FAQ ?</router-link>
              </li>
            </ul>
            <tabs :tabs="tabs" :active-tab.sync="activeTab" :has-features="hasFeatures" />
          </div>
          <div class="box">
            <panel ref="panel0" :index="0" :active-tab="activeTab" class="is-relative">
              <validation-button
                class="is-hidden-mobile yeti-validation--top"
                :current-error="currentError"
                :loading="promise"
                @click="compute"
                tabindex="-1"
              />
              <sub-panel-bra :bra.sync="bra" :mountains="mountains" />
              <sub-panel-methods :method.sync="method" :bra="bra" @warn-about-method-bra="warnAboutMethodBra" />
              <validation-button
                v-show="method.type"
                class="yeti-validation--bottom"
                :current-error="currentError"
                :loading="promise"
                @click="compute"
              />
            </panel>

            <panel ref="panel1" :index="1" :active-tab="activeTab">
              <sub-panel-course
                :map="yetiMap"
                :features="features"
                :features-title.sync="featuresTitle"
                @gpx="onGpxLoaded"
              />
            </panel>
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

        <yeti-map
          ref="map"
          :gpx="gpx"
          :active-tab="activeTab"
          :valid-min-zoom="validFormData.minZoom"
          :map-zoom.sync="mapZoom"
          :computed-extent="yetiExtent"
          :computed-data="yetiImage"
          :mountains.sync="mountains"
          :area-ok.sync="areaOk"
          :features.sync="features"
          :features-title.sync="featuresTitle"
        />
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

import Panel from '@/components/yeti/Panel';
import SubPanelBra from '@/components/yeti/SubPanelBra';
import SubPanelCourse from '@/components/yeti/SubPanelCourse';
import SubPanelMethods from '@/components/yeti/SubPanelMethods';
import Tabs from '@/components/yeti/Tabs';
import Texts from '@/components/yeti/Texts';
import ValidationButton from '@/components/yeti/ValidationButton';
import YetiMap from '@/components/yeti/YetiMap';
import ol from '@/js/libs/ol';

const YETI_URL_BASE =
  'https://api.ensg.eu/yeti-wps?request=Execute&service=WPS&version=1.0.0&identifier=Yeti&datainputs=';

const VALID_FORM_DATA = {
  minZoom: 13,
  braMaxMrd: 3,
};

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

const TEXTS = {
  featuresTitle: 'Nouvel itinéraire',
};

export default {
  name: 'Yeti',

  components: {
    Panel,
    SubPanelBra,
    SubPanelCourse,
    SubPanelMethods,
    Tabs,
    Texts,
    ValidationButton,
    YetiMap,
  },

  data() {
    return {
      showDisclaimer: false,
      checkDisclaimer: false,

      yetiMap: null,

      tabs: ['Calcul', 'Course'],
      activeTab: 0,

      validFormData: VALID_FORM_DATA,

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

      mapZoom: 0,
      formError: undefined,
      currentError: undefined,

      promise: null,
      yetiImage: null,
      yetiLayer: null,
      yetiExtent: [],

      features: [],
      gpx: null,
      featuresTitle: TEXTS.featuresTitle,

      mountains: {},

      areaOk: true,
    };
  },

  computed: {
    mrdIsNotApplicable() {
      return this.isBraMax && this.method.type === 'mrd';
    },

    isBraMax() {
      return this.bra.high > this.validFormData.braMaxMrd || this.bra.low > this.validFormData.braMaxMrd;
    },

    isValidMapZoom() {
      return this.mapZoom >= this.validFormData.minZoom;
    },

    hasFeatures() {
      return !!this.features.length;
    },
  },

  watch: {
    'bra.low': 'check',
    'bra.altiThreshold': 'check',
    'bra.isDifferent': 'check',
    'method.type': 'check',
    'method.potentialDanger': 'check',
    mapZoom: 'check',
    areaOk: 'check',
    featuresTitle(newValue) {
      // set default featuresTitle if null (from yeti map)
      if (newValue === null) {
        this.featuresTitle = TEXTS.featuresTitle;
      }
    },
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
  },

  methods: {
    check() {
      if (!this.areaOk) {
        this.formError = 'area';
      } else if (!this.isValidMapZoom) {
        this.formError = 'zoom';
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
          this.currentError += ' (actuel: ' + this.mapZoom + ' sur ' + this.validFormData.minZoom + ')';
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
      this.yetiMap.clearLayers();

      // fetch img
      this.promise = axios
        .get(yetiUrl)
        .then((result) => this.onYetiResult(result, extendedExtent))
        .catch(this.onYetiError);
    },

    extendExtent(extent) {
      const extendedFactor = Math.min(0.5, (this.mapZoom - this.validFormData.minZoom) / 6);
      const extendedValue = Math.max(extent[2] - extent[0], extent[3] - extent[1]) * extendedFactor;
      return ol.extent.buffer(extent, extendedValue);
    },

    onYetiResult(result, extendedExtent) {
      this.yetiImage = result.data;
      this.yetiExtent = extendedExtent;

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

    onSubmitDisclaimer() {
      this.showDisclaimer = false;
      this.$localStorage.set('yeti-disclaimer', 'validated');
    },

    onGpxLoaded(data) {
      this.gpx = data;
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

.yeti-columns--reverse {
  flex-direction: row-reverse;
}

@media screen and (max-width: $tablet) {
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

.yeti-overlay {
  position: absolute;
  z-index: 10;
  top: 0.75rem;
  right: 0;
  left: 0;
  min-height: 100%;

  & ~ .yeti-content {
    visibility: hidden;
  }
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
