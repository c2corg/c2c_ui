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
            <tabs :tabs="yetiTabs" />
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

        <yeti-map ref="yetiMapView" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import axios, { type AxiosError, type AxiosResponse } from 'axios';
import type { Extent } from 'ol/extent';
import { computed, onMounted, ref, shallowRef, useTemplateRef, watch } from 'vue';

import YetiArticle from '@/components/yeti/Article.vue';
import Panel from '@/components/yeti/Panel.vue';
import SubPanelBra from '@/components/yeti/SubPanelBra.vue';
import SubPanelCourse from '@/components/yeti/SubPanelCourse.vue';
import SubPanelLayers from '@/components/yeti/SubPanelLayers.vue';
import SubPanelMeteo from '@/components/yeti/SubPanelMeteo.vue';
import SubPanelMethods from '@/components/yeti/SubPanelMethods.vue';
import Tabs from '@/components/yeti/Tabs.vue';
import ValidationButton from '@/components/yeti/ValidationButton.vue';
import YetiMap from '@/components/yeti/YetiMap.vue';
import Yetix from '@/components/yeti/yetix';
import yetixEvents from '@/components/yeti/yetix-events';
import type { YetiTab } from '@/components/yeti/yetix-types';
import { useGlobalProperties } from '@/js/composables/global-properties';
import ol from '@/js/libs/ol';
import { getPreferences } from '@/js/vue-plugins/local-storage';

defineOptions({ name: 'Yeti' });

const YETI_URL_BASE =
  'https://api.ensg.eu/yeti-wps?request=Execute&service=WPS&version=1.0.0&identifier=Yeti&datainputs=';

// stored under the component name, as before: existing preferences are kept
const preferences = getPreferences('Yeti');

type FormError = 'area' | 'zoom' | 'bra' | 'altitude' | 'method' | 'method_bra';

const { $gettext } = useGlobalProperties();

const yetiMapView = useTemplateRef<InstanceType<typeof YetiMap>>('yetiMapView');

const showDisclaimer = ref(false);
const checkDisclaimer = ref(false);

const articles = {
  faq: {
    id: 1257569,
    title: 'FAQ',
  },
  disclaimer: {
    id: 1257571,
    title: $gettext('Disclaimer'),
  },
};

const formError = ref<FormError | null>();
const currentError = ref<string>();

const promise = shallowRef<Promise<void>>();

const validMinimumMapZoom = computed(() => Yetix.VALID_MINIMUM_MAP_ZOOM);
const dangerMaxWhenMrd = computed(() => Yetix.DANGER_MAX_WHEN_MRD);
const bra = computed(() => Yetix.bra);
const method = computed(() => Yetix.method);
const mapZoom = computed(() => Yetix.mapZoom);
const areaOk = computed(() => Yetix.areaOk);
const hasFeatures = computed(() => Yetix.hasFeatures);
const featuresLength = computed(() => Yetix.features.length);
const validSimplifyTolerance = computed(() => Yetix.validSimplifyTolerance);
// not named tabs: it would hide the <tabs> component
const yetiTabs = computed(() => Yetix.tabs);
const localTabs = computed(() => {
  const tabs: YetiTab[] = [];

  // layer tab
  const tabLayer: YetiTab = {
    id: 'layer',
    icon: 'layer-group',
    title: $gettext('Layers'),
  };
  tabs.push(tabLayer);

  // risk tab
  const tabRisk: YetiTab = {
    id: 'risk',
    name: $gettext('Risk'),
    icon: 'bolt',
  };
  tabs.push(tabRisk);

  // route tab
  const tabRoute: YetiTab = {
    id: 'route',
    name: $gettext('My outing'),
    icon: 'route',
  };
  if (hasFeatures.value && !validSimplifyTolerance.value) {
    tabRoute.counter = {
      text: featuresLength.value,
      title: $gettext('Route on map'),
    };
  }
  if (validSimplifyTolerance.value) {
    tabRoute.problemIcon = {
      title: $gettext('Not simplified yet'),
    };
  }
  tabs.push(tabRoute);

  // meteo tab
  const tabMeteo: YetiTab = {
    id: 'meteo',
    name: $gettext('Meteo'),
    icon: 'sun',
  };
  tabs.push(tabMeteo);

  return tabs;
});
const errors = computed(() => ({
  area: {
    simple: $gettext('Area not covered'),
    full: $gettext(
      'Current map view is not covered by YETI. Only french mountains are as of now (determined by a dashed stroke).'
    ),
  },
  method: {
    simple: $gettext('Missing method'),
    full: $gettext('Please select a method before computing.'),
  },
  method_bra: {
    simple: $gettext('Conflicting method and danger'),
    full: $gettext('The MRD method (beginner) is allowed when danger is 3 maximum. Choose another method: MRE or MRP.'),
  },
  bra: {
    simple: $gettext('Missing danger level'),
    full: $gettext('Please set danger level as specified on avalanche bulletin for the specific area.'),
  },
  altitude: {
    simple: $gettext('Missing altitude'),
    full: $gettext(
      'Altitude is mandatory when danger high and low are different. Please set altitude as specified on avalanche bulletin for the specific area.'
    ),
  },
  zoom: {
    simple: $gettext('Area too large'),
    full: $gettext('Current map view is too large. Please zoom to level') + ' ' + validMinimumMapZoom.value,
  },
  ok: $gettext('Seems fine! :)'),
  yeti: $gettext('Service is inactive right now'),
  yeti_prefix: 'YETI Service: ',
  yeti_unauthorized: $gettext('You have to be authorized. Please contact administrators of the service if interested.'),
}));
const isBraMax = computed(
  () => (bra.value.high ?? 0) > dangerMaxWhenMrd.value || (bra.value.low ?? 0) > dangerMaxWhenMrd.value
);
const mrdIsNotApplicable = computed(() => isBraMax.value && method.value.type === 'mrd');
const isValidMapZoom = computed(() => mapZoom.value >= validMinimumMapZoom.value);

watch(
  [
    () => bra.value.low,
    () => bra.value.altiThreshold,
    () => bra.value.isDifferent,
    () => method.value.type,
    () => method.value.potentialDanger,
    mapZoom,
    areaOk,
  ],
  check
);
watch(localTabs, (tabs) => Yetix.setTabs(tabs), { deep: true });

// show disclaimer if not already validated
if (!preferences.get('yeti-disclaimer')) {
  showDisclaimer.value = true;
}
// tmp: set default values for persistent state
Yetix.setDefault();
// remove all previous events (navigating from other c2c pages)
yetixEvents.all.clear();

// build tabs: here, after setDefault() resets them, then on each change of localTabs
Yetix.setTabs(localTabs.value);

onMounted(() => {
  check();
});

function check() {
  if (!areaOk.value) {
    formError.value = 'area';
  } else if (!isValidMapZoom.value) {
    formError.value = 'zoom';
  } else if (!bra.value.high) {
    formError.value = 'bra';
  } else if (bra.value.low && bra.value.high !== bra.value.low && !bra.value.altiThreshold) {
    formError.value = 'altitude';
  } else if (!method.value.type) {
    formError.value = 'method';
  } else if (mrdIsNotApplicable.value) {
    formError.value = 'method_bra';
  } else if (bra.value.isDifferent && (!bra.value.low || !bra.value.high)) {
    formError.value = 'bra';
  } else {
    formError.value = null;
  }
  // also
  // verif if bra = 4, method MRD forbidden
  if (mrdIsNotApplicable.value) {
    Yetix.setMethod('type', null);
  }

  // then set errors
  setCurrentError();
}

function warnAboutMethodBra(item: string) {
  if (item === 'mrd' && isBraMax.value) {
    window.alert(errors.value.method_bra.full);
  }
}

function setCurrentError() {
  if (formError.value) {
    currentError.value = errors.value[formError.value]['simple'];
    if (formError.value === 'zoom') {
      currentError.value +=
        ' (' +
        $gettext('current zoom:') +
        ' ' +
        mapZoom.value +
        ' ' +
        $gettext('on') +
        ' ' +
        validMinimumMapZoom.value +
        ')';
    }
  } else {
    currentError.value = errors.value['ok'];
  }
}

function compute() {
  if (formError.value) {
    window.alert(errors.value[formError.value]['full']);
    return;
  }

  const extent = yetiMapView.value!.getExtent('EPSG:3857');
  const extendedExtent = extendExtent(extent);

  const yetiUrl = getYetiUrl(extendedExtent);

  // first, set data to null (will remove last one)
  Yetix.setYetiData(null);

  // fetch img
  promise.value = axios
    .get(yetiUrl)
    .then((result) => onYetiResult(result, extendedExtent))
    .catch(onYetiError);
}

function extendExtent(extent: Extent) {
  const extendedFactor = Math.min(0.5, (mapZoom.value - validMinimumMapZoom.value) / 6);
  const extendedValue = Math.max(extent[2] - extent[0], extent[3] - extent[1]) * extendedFactor;
  return ol.extent.buffer(extent, extendedValue);
}

function onYetiResult(result: AxiosResponse, extendedExtent: Extent) {
  Yetix.setYetiData(result.data);
  Yetix.setYetiExtent(extendedExtent);

  promise.value = undefined;
}

function onYetiError(err: AxiosError<string>) {
  promise.value = undefined;

  let errorText = errors.value['yeti'];

  // no response on a network error
  if (err.response?.status === 400) {
    const xml = new DOMParser().parseFromString(err.response.data, 'text/xml');
    errorText = [...xml.getElementsByTagName('ExceptionText')].map((_) => _.textContent).join(' ');
  }

  if (err.response?.status === 403) {
    errorText = errors.value['yeti_unauthorized'];
  }

  window.alert(errors.value['yeti_prefix'] + errorText);
}

function getYetiUrl(extent: Extent) {
  // project extent
  const bbox = ol.proj.transformExtent(extent, 'EPSG:3857', 'EPSG:4326');

  // set bra.low / altiThreshold
  const braLow = bra.value.isDifferent ? bra.value.low : bra.value.high;
  const braAltiThreshold = bra.value.isDifferent ? bra.value.altiThreshold : 0;

  // mre
  const compass =
    method.value.type === 'mre' && method.value.orientation.length !== 0
      ? 'none,' + method.value.orientation.join(',').toLowerCase()
      : 'none';

  // mrp
  const potentialDanger = method.value.type === 'mrp' ? method.value.potentialDanger : 0;
  const wetSnow = method.value.type === 'mrp' ? method.value.wetSnow : false;
  const groupSize = method.value.type === 'mrp' ? Math.floor(method.value.groupSize) : 0;

  // create url
  let result = YETI_URL_BASE;
  result += `methode=${method.value.type};`;
  result += `bbox=${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]};`;
  result += `risque_haut=${bra.value.high};`;
  result += `risque_bas=${braLow};`;
  result += `seuil_alti=${braAltiThreshold}`;

  // specific parameters based on method
  if (method.value.type === 'mre') {
    result += `;rdv=${compass}`;
  } else if (method.value.type === 'mrp') {
    result += `;potentiel_danger=${potentialDanger};`;
    result += `neige_mouillee=${wetSnow};`;
    result += `taille_groupe=${groupSize}`;
  }

  return result;
}

function onSubmitDisclaimer() {
  showDisclaimer.value = false;
  preferences.set('yeti-disclaimer', 'validated');
}
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
    clip-path: inset(50%);
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
