<template>
  <!-- eslint-disable no-irregular-whitespace -->
  <div>
    <div class="section yeti-app">
      <html-header title="YETI" />
      <div class="box yeti-overlay" v-if="showDisclaimer">
        <yeti-article class="yeti-article--disclaimer" :article="articles.disclaimer"></yeti-article>
        <form action="#" @submit="onSubmitDisclaimer">
          <input-checkbox v-model="checkDisclaimer">
            <span v-translate>I read and understood the interest and limitations of YETI</span>
          </input-checkbox>
          <button class="button is-primary" :disabled="!checkDisclaimer" v-translate>Launch YETI</button>
        </form>
      </div>

      <div class="box yeti-overlay" v-if="$route.params.page === 'faq'">
        <p><router-link to="." v-translate>Go back to YETI</router-link></p>
        <yeti-article class="yeti-article--disclaimer" :article="articles.disclaimer"></yeti-article>
        <yeti-article :article="articles.faq"></yeti-article>
      </div>

      <div class="columns yeti-content">
        <div class="column is-5-tablet is-5-desktop is-4-fullhd form-container">
          <div class="columns is-mobile is-justify-content-space-between mb-5">
            <div class="is-flex is-align-items-center yeti-title">
              <h1 class="ml-3 mr-1 px-2 has-text-weight-bold has-background-primary has-text-white">YETI</h1>
              <p class="has-text-primary">Préparez votre course</p>
            </div>
            <ul class="column is-narrow pb-0">
              <li>
                <router-link class="is-block yetitabs-link" :to="$route.fullPath + '/faq'" v-translate>
                  FAQ?
                </router-link>
              </li>
            </ul>
          </div>
          <div class="columns mb-0 is-mobile">
            <tabs :tabs="tabs" />
          </div>
          <div class="box">
            <panel :index="0">
              <sub-panel-layers />
            </panel>
            <panel :index="1">
              <validation-button
                class="is-hidden-mobile yeti-validation--top"
                :current-error="currentError"
                :loading="promise"
                @click="compute"
                tabindex="-1"
              />
              <sub-panel-bra />
              <sub-panel-methods @warn-about-method-bra="warnAboutMethodBra" />
              <validation-button
                v-show="method.type"
                class="yeti-validation--bottom"
                :current-error="currentError"
                :loading="promise"
                @click="compute"
              />
            </panel>

            <panel :index="2">
              <sub-panel-course />
            </panel>

            <panel :index="3">
              <sub-panel-meteo />
            </panel>
          </div>

          <div class="box yeti-logos">
            <div class="columns is-mobile is-vcentered">
              <div class="column has-text-centered">
                <a href="http://www.geodata-paris.fr">
                  <picture>
                    <source srcset="@/assets/img/yeti/logo-geodataparis.webp" type="image/webp" />
                    <source srcset="@/assets/img/yeti/logo-geodataparis.avif" type="image/avif" />
                    <img src="@/assets/img/yeti/logo-geodataparis.jpg" alt="Logo Géodata Paris" loading="lazy" />
                  </picture>
                </a>
              </div>
              <div class="column has-text-centered">
                <a href="https://www.petzl.com/fondation/fondation-petzl?language=fr">
                  <picture>
                    <source srcset="@/assets/img/yeti/logo-fondation-petzl.webp" type="image/webp" />
                    <source srcset="@/assets/img/yeti/logo-fondation-petzl.avif" type="image/avif" />
                    <img
                      src="@/assets/img/yeti/logo-fondation-petzl.jpg"
                      alt="Logo Fondation Petzl"
                      width="90"
                      loading="lazy"
                    />
                  </picture>
                </a>
              </div>
            </div>
          </div>
        </div>

        <yeti-map ref="map" />
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

import YetiArticle from '@/components/yeti/Article';
import Panel from '@/components/yeti/Panel';
import SubPanelBra from '@/components/yeti/SubPanelBra';
import SubPanelCourse from '@/components/yeti/SubPanelCourse';
import SubPanelLayers from '@/components/yeti/SubPanelLayers';
import SubPanelMeteo from '@/components/yeti/SubPanelMeteo';
import SubPanelMethods from '@/components/yeti/SubPanelMethods';
import Tabs from '@/components/yeti/Tabs';
import ValidationButton from '@/components/yeti/ValidationButton';
import YetiMap from '@/components/yeti/YetiMap';
import Yetix from '@/components/yeti/Yetix';
import ol from '@/js/libs/ol';

const YETI_URL_BASE =
  'https://api.ensg.eu/yeti-wps?request=Execute&service=WPS&version=1.0.0&identifier=Yeti&datainputs=';

export default {
  name: 'Yeti',

  components: {
    YetiArticle,
    Panel,
    SubPanelBra,
    SubPanelCourse,
    SubPanelLayers,
    SubPanelMeteo,
    SubPanelMethods,
    Tabs,
    ValidationButton,
    YetiMap,
  },

  data() {
    return {
      showDisclaimer: false,
      checkDisclaimer: false,

      articles: {
        faq: {
          id: 1257569,
          title: 'FAQ',
        },
        disclaimer: {
          id: 1257571,
          title: this.$gettext('Disclaimer'),
        },
      },

      formError: undefined,
      currentError: undefined,

      promise: null,
    };
  },

  computed: {
    validMinimumMapZoom() {
      return Yetix.VALID_MINIMUM_MAP_ZOOM;
    },
    dangerMaxWhenMrd() {
      return Yetix.DANGER_MAX_WHEN_MRD;
    },
    bra() {
      return Yetix.bra;
    },
    method() {
      return Yetix.method;
    },
    mapZoom() {
      return Yetix.mapZoom;
    },
    areaOk() {
      return Yetix.areaOk;
    },
    hasFeatures() {
      return Yetix.hasFeatures;
    },
    featuresLength() {
      return Yetix.features.length;
    },
    validSimplifyTolerance() {
      return Yetix.validSimplifyTolerance;
    },
    tabs() {
      return Yetix.tabs;
    },
    errors() {
      return {
        area: {
          simple: this.$gettext('Area not covered'),
          full: this.$gettext(
            'Current map view is not covered by YETI. Only french mountains are as of now (determined by a dashed stroke).'
          ),
        },
        method: {
          simple: this.$gettext('Missing method'),
          full: this.$gettext('Please select a method before computing.'),
        },
        method_bra: {
          simple: this.$gettext('Conflicting method and danger'),
          full: this.$gettext(
            'The MRD method (beginner) is allowed when danger is 3 maximum. Choose another method: MRE or MRP.'
          ),
        },
        bra: {
          simple: this.$gettext('Missing danger level'),
          full: this.$gettext('Please set danger level as specified on avalanche bulletin for the specific area.'),
        },
        altitude: {
          simple: this.$gettext('Missing altitude'),
          full: this.$gettext(
            'Altitude is mandatory when danger high and low are different. Please set altitude as specified on avalanche bulletin for the specific area.'
          ),
        },
        zoom: {
          simple: this.$gettext('Area too large'),
          full: this.$gettext('Current map view is too large. Please zoom to level') + ' ' + this.validMinimumMapZoom,
        },
        ok: this.$gettext('Seems fine! :)'),
        yeti: this.$gettext('Service is inactive right now'),
        yeti_prefix: 'YETI Service: ',
        yeti_unauthorized: this.$gettext(
          'You have to be authorized. Please contact administrators of the service if interested.'
        ),
      };
    },
    mrdIsNotApplicable() {
      return this.isBraMax && this.method.type === 'mrd';
    },
    isBraMax() {
      return this.bra.high > this.dangerMaxWhenMrd || this.bra.low > this.dangerMaxWhenMrd;
    },
    isValidMapZoom() {
      return this.mapZoom >= this.validMinimumMapZoom;
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
  },

  created() {
    // show disclaimer if not already validated
    if (!this.$localStorage.get('yeti-disclaimer')) {
      this.showDisclaimer = true;
    }
    // tmp: set default values for persistent state
    Yetix.setDefault();
    // remove all previous events (navigating from other c2c pages)
    Yetix.$off();

    // build tabs
    let tabs = this.setTabs();
    Yetix.setTabs(tabs);
  },

  mounted() {
    this.check();
  },

  methods: {
    setTabs() {
      let tabs = [];

      // layer tab
      let tabLayer = {
        id: 'layer',
        icon: 'layer-group',
        title: this.$gettext('Layers'),
      };
      tabs.push(tabLayer);

      // risk tab
      let tabRisk = {
        id: 'risk',
        name: this.$gettext('Risk'),
        icon: 'bolt',
      };
      tabs.push(tabRisk);

      // route tab
      let tabRoute = {
        id: 'route',
        name: this.$gettext('My outing'),
        icon: 'route',
      };
      if (this.hasFeatures && !this.validSimplifyTolerance) {
        tabRoute.counter = {
          text: this.featuresLength,
          title: this.$gettext('Route on map'),
        };
      }
      if (this.validSimplifyTolerance) {
        tabRoute.problemIcon = {
          title: this.$gettext('Not simplified yet'),
        };
      }
      tabs.push(tabRoute);

      // meteo tab
      let tabMeteo = {
        id: 'meteo',
        name: this.$gettext('Meteo'),
        icon: 'sun',
      };
      tabs.push(tabMeteo);

      return tabs;
    },
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
        window.alert(this.errors.method_bra.full);
      }
    },

    setCurrentError() {
      if (this.formError) {
        this.currentError = this.errors[this.formError]['simple'];
        if (this.formError === 'zoom') {
          this.currentError +=
            ' (' +
            this.$gettext('current zoom:') +
            ' ' +
            this.mapZoom +
            ' ' +
            this.$gettext('on') +
            ' ' +
            this.validMinimumMapZoom +
            ')';
        }
      } else {
        this.currentError = this.errors['ok'];
      }
    },

    compute() {
      if (this.formError) {
        window.alert(this.errors[this.formError]['full']);
        return;
      }

      const extent = this.$refs.map.getExtent('EPSG:3857');
      const extendedExtent = this.extendExtent(extent);

      const yetiUrl = this.getYetiUrl(extendedExtent);

      // first, set data to null (will remove last one)
      Yetix.setYetiData(null);

      // fetch img
      this.promise = axios
        .get(yetiUrl)
        .then((result) => this.onYetiResult(result, extendedExtent))
        .catch(this.onYetiError);
    },

    extendExtent(extent) {
      const extendedFactor = Math.min(0.5, (this.mapZoom - this.validMinimumMapZoom) / 6);
      const extendedValue = Math.max(extent[2] - extent[0], extent[3] - extent[1]) * extendedFactor;
      return ol.extent.buffer(extent, extendedValue);
    },

    onYetiResult(result, extendedExtent) {
      Yetix.setYetiData(result.data);
      Yetix.setYetiExtent(extendedExtent);

      this.promise = null;
    },

    onYetiError(err) {
      this.promise = null;

      let errorText = this.errors['yeti'];

      if (err.response.status === 400) {
        const xml = new DOMParser().parseFromString(err.response.data, 'text/xml');
        errorText = [...xml.getElementsByTagName('ExceptionText')].map((_) => _.textContent).join(' ');
      }

      if (err.response.status === 403) {
        errorText = this.errors['yeti_unauthorized'];
      }

      window.alert(this.errors['yeti_prefix'] + errorText);
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
      result += `seuil_alti=${braAltiThreshold}`;

      // specific parameters based on method
      if (this.method.type === 'mre') {
        result += `;rdv=${compass}`;
      } else if (this.method.type === 'mrp') {
        result += `;potentiel_danger=${potentialDanger};`;
        result += `neige_mouillee=${wetSnow};`;
        result += `taille_groupe=${groupSize}`;
      }

      return result;
    },

    onSubmitDisclaimer() {
      this.showDisclaimer = false;
      this.$localStorage.set('yeti-disclaimer', 'validated');
    },
  },
};
</script>

<style scoped lang="scss">
$section-padding: 0.75rem; //TODO find this variable
$box-padding: 1.25rem; //TODO find this variable
$header-height: 34px;
$box-margin: 1.5rem; //TODO find this variable
$yeti-height: calc(100vh - #{$navbar-height});
$yeti-height-ad: calc(100vh - #{$navbarad-height});

.yeti-app {
  position: relative;
  padding: $section-padding;
}

.yeti-icon {
  transform: scale(0.9);
}

.yeti-title {
  margin-top: calc(0.75rem + 2px);
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
      max-width: 450px;
      height: calc(100% - 0.75rem);
      overflow: auto;
    }
  }
}

@media screen and (min-width: $widescreen) {
  .yeti-content {
    height: $yeti-height-ad;
  }
}

.yeti-validation--top {
  position: absolute;
  right: 0;
  top: 0.75rem;
  width: 55%;
  z-index: 1;
}

.yeti-validation--bottom {
  margin-top: 1rem;
}

.yeti-logos {
  box-shadow: none;
  background: none;
  mix-blend-mode: multiply;
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

  /* a11y of forms */
  *:focus-visible {
    scroll-margin: 100px;
  }
  .is-checkradio[type='checkbox'],
  .is-checkradio[type='radio'] {
    display: block;
    clip: rect(0, 0, 0, 0);
  }
  .is-checkradio[type='radio'].is-primary:focus-visible + label::before,
  .is-checkradio[type='checkbox'].is-primary:focus-visible + label::before {
    border-color: $primary;
  }
  .is-checkradio[type='radio'].is-primary:focus + label::before,
  .is-checkradio[type='checkbox'].is-primary:focus + label::before {
    outline: none;
  }

  /* customization of forms */
  .select select,
  .input {
    border: none;
    box-shadow: 0 0 0 1px $grey-lighter;
  }
  .select select:hover,
  .select select:focus,
  .input:hover,
  .input:focus {
    box-shadow: 0 0 0 2px $primary;
  }
  .is-checkradio[type='checkbox'] + label::after {
    border-right-width: 3px;
    border-bottom-width: 3px;
    border-color: white !important;
    /* decimal rem = integer pixels */
    /* 0.357 = 5px, 0.429 = 6px, 0.571 = 8px, 0.714 = 10px */
    width: 0.429rem !important;
    height: 0.714rem !important;
    top: 0.357rem !important;
    left: 0.571rem !important;
    transform: rotate(45deg) scale(0);
  }
  .is-checkradio[type='checkbox']:checked + label::after {
    transform: rotate(45deg) scale(1);
    border-color: white !important;
  }
  .is-checkradio[type='radio'] + label::after {
    width: 0.5rem !important;
    height: 0.5rem !important;
    top: 0.5rem !important;
    left: 0.5rem !important;
    transform: scale(0);
  }
  .is-checkradio[type='radio']:checked + label::after {
    transform: scale(1);
    background-color: white !important;
  }
  .is-checkradio[type='checkbox']:checked + label::before,
  .is-checkradio[type='radio']:checked + label::before {
    background: $primary;
    border-color: $primary !important;
  }
  .is-checkradio:hover:not([disabled]) + label::before,
  .is-checkradio:focus + label::before {
    border-width: 2px;
  }
  .is-checkradio:focus-visible + label::before {
    box-shadow: 0 0 0 2px $secondary;
  }

  .button.is-small {
    border-radius: 4px;
  }
}
</style>
