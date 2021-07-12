<template>
  <!-- eslint-disable no-irregular-whitespace -->
  <div class="section">
    <html-header title="Yeti" />
    <div class="box">
      <h1 class="title is-1">
        <div class="yeti-icon is-inline-block">
          <icon-yeti />
        </div>
        <span v-translate>YETI - A preparation tool for your outing</span>
      </h1>
    </div>

    <div class="yeti-app">
      <div class="box yeti-overlay" v-if="showDisclaimer">
        <yeti-article class="yeti-article--disclaimer" :article="articles.disclaimer"></yeti-article>
        <form action="#" @submit="onSubmitDisclaimer">
          <input-checkbox v-model="checkDisclaimer" v-translate>
            I read and understood the interest and limitations of YETI
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
        <div class="column is-6-tablet is-6-desktop is-5-widescreen is-4-fullhd form-container">
          <div class="columns mb-0 yeti-columns--reverse is-mobile">
            <ul class="column is-narrow pb-0">
              <li>
                <router-link class="is-block yetitabs-link" :to="$route.fullPath + '/faq'" v-translate>
                  FAQ?
                </router-link>
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
              <sub-panel-course :features="features" :features-title.sync="featuresTitle" @gpx="onGpxLoaded" />
            </panel>
          </div>

          <div class="box yeti-logos">
            <div class="columns is-mobile is-vcentered">
              <div class="column has-text-centered">
                <a href="http://www.ensg.eu">
                  <picture>
                    <source srcset="@/assets/img/yeti/logo-ensg.webp" type="image/webp" />
                    <source srcset="@/assets/img/yeti/logo-ensg.avif" type="image/avif" />
                    <img src="@/assets/img/yeti/logo-ensg.jpg" alt="Logo ENSG" width="120" loading="lazy" />
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

        <yeti-map
          ref="map"
          :gpx="gpx"
          :active-tab="activeTab"
          :valid-min-zoom="validFormData.minZoom"
          :map-zoom.sync="mapZoom"
          :yeti-data="yetiData"
          :yeti-extent="yetiExtent"
          :features="features"
        />
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import Vue from 'vue';

import YetiArticle from '@/components/yeti/Article';
import Panel from '@/components/yeti/Panel';
import SubPanelBra from '@/components/yeti/SubPanelBra';
import SubPanelCourse from '@/components/yeti/SubPanelCourse';
import SubPanelMethods from '@/components/yeti/SubPanelMethods';
import Tabs from '@/components/yeti/Tabs';
import ValidationButton from '@/components/yeti/ValidationButton';
import YetiMap from '@/components/yeti/YetiMap';
import ol from '@/js/libs/ol';

const YETI_URL_BASE =
  'https://api.ensg.eu/yeti-wps?request=Execute&service=WPS&version=1.0.0&identifier=Yeti&datainputs=';

const VALID_FORM_DATA = {
  minZoom: 13,
  braMaxMrd: 3,
};

const $yetix = new Vue();

export default {
  name: 'Yeti',

  components: {
    YetiArticle,
    Panel,
    SubPanelBra,
    SubPanelCourse,
    SubPanelMethods,
    Tabs,
    ValidationButton,
    YetiMap,
  },

  provide() {
    return {
      $yetix: $yetix,
    };
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

      tabs: [this.$gettext('Compute'), this.$gettext('Outing')],
      activeTab: 0,

      errors: {
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
          full: this.$gettext('Current map view is too large. Please zoom to level ' + VALID_FORM_DATA.minZoom),
        },
        ok: this.$gettext('Seems fine! :)'),
        yeti: this.$gettext('Service is inactive right now'),
        yeti_prefix: 'YETI Service: ',
        yeti_unauthorized: this.$gettext(
          'You have to be authorized. Please contact administrators of the service if interested.'
        ),
      },

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
      yetiData: null,
      yetiExtent: [],

      features: [],
      gpx: null,
      featuresTitle: this.$gettext('New route'),

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
        this.featuresTitle = this.$gettext('New route');
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
    this.check();

    // mutations
    $yetix.$on('features', (features) => {
      this.features = features;
    });
    $yetix.$on('areaOk', (areaOk) => {
      this.areaOk = areaOk;
    });
    $yetix.$on('mountains', (mountains) => {
      this.mountains = mountains;
    });
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
            this.validFormData.minZoom +
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
      this.yetiData = null;

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
      this.yetiData = result.data;
      this.yetiExtent = extendedExtent;

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
