<template>
<!-- eslint-disable -->
  <div class="section">
    <html-header title="Yeti" />
    <div class="box">
      <h1 class="title is-1">
        <span>YETI - Un outil de préparation de course</span>
        <span class="is-pulled-right has-text-primary">
          <fa-icon icon="map-marked-alt" />
        </span>
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
          <button class="button is-primary" :disabled="!checkDisclaimer">
            Accéder à YETI
          </button>
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
                <h2 class="title is-3 yeti-title">
                  Info <abbr title="Bulletin d’estimation du risque d’avalanche">BRA</abbr>
                </h2>
              </div>
              <div class="column">
                <router-link class="is-size-6 is-pulled-right" to="/yeti/faq">FAQ ?</router-link>
              </div>
            </div>
            <div class="columns">
              <div class="column">
                <div class="inputs-bra" :class="{'inputs-bra-different' : bra.isDifferent}">
                  <svg viewBox="0 0 100 100" width="120" height="120">
                    <polygon style="fill:none;stroke:#000;stroke-miterlimit:10;" points="2.2,89.5 97.5,89.5 62.7,11.9 48,32.9 31.8,25.5 " />
                    <line
                      v-show="bra.isDifferent"
                      style="fill:none;stroke:#000;stroke-miterlimit:10;"
                      x1="10"
                      y1="61.5"
                      x2="90"
                      y2="61.5" />
                  </svg>
                  <div class="input-bra-high select is-small">
                    <select v-model="bra.high" aria-label="Niveau de danger BRA haut">
                      <option :value="null" selected />
                      <option :value="1">1</option>
                      <option :value="2">2</option>
                      <option :value="3">3</option>
                      <option :value="4">4</option>
                    </select>
                  </div>

                  <div v-show="bra.isDifferent" class="input-bra-threshold control">
                    <input
                      class="input is-small"
                      type="number"
                      min="0"
                      max="4800"
                      step="100"
                      v-model="bra.altiThreshold"
                      maxlength="4"
                      aria-label="Altitude seuil">
                  </div>

                  <div v-show="bra.isDifferent" class="input-bra-low select is-small">
                    <select v-model="bra.low" aria-label="Niveau de danger BRA bas">
                      <option :value="null" selected />
                      <option :value="1">1</option>
                      <option :value="2">2</option>
                      <option :value="3">3</option>
                      <option :value="4">4</option>
                    </select>
                  </div>
                </div>

                <div>
                  <input-checkbox v-model="bra.isDifferent" class="control--bradifferent">
                    BRA haut/bas différents ?
                  </input-checkbox>
                </div>
              </div>

              <div class="column has-text-right">
                <validation-button
                  :current-error="currentError"
                  :loading="promise"
                  @click="compute" />
              </div>

            </div>

            <div class="yetimountains">
              <div>
                <p class="yetimountains-title" @click="showMountainsList = !showMountainsList">
                  Liste des massifs
                  <span v-if="promiseMountains" class="yetimountains-count">{{ countVisibleMountains }}</span>
                  <fa-icon
                    class="yetimountains-arrow is-size-6 is-pulled-right has-cursor-pointer no-print"
                    icon="angle-down"
                    :rotation="showMountainsList ? 180 : undefined" />
                </p>
              </div>
              <div v-if="showMountainsList">
                <div v-if="promiseMountains">
                  <p class="column yetiform-info">Téléchargez le bulletin en PDF depuis le site de Météo France</p>
                  <dl>
                    <div v-for="(mountains, massif) of visibleMountains" :key="massif">
                      <dt class="yetimountains-listtitle">
                        {{ massif }}
                      </dt>
                      <div class="yetimountains-list">
                        <dd class="yetimountains-listelement" v-for="mountain of mountains" :key="mountain.title">
                          <a :href="'http://www.meteofrance.com/integration/sim-portail/generated/integration/img/produits/pdf/bulletins_bra/' + mountain.id_mf + '.pdf'" target="_blank" v-if="mountain.id_mf">
                            <fa-icon icon="external-link-alt" />
                            {{ mountain.title }}
                          </a>
                          <span v-else>{{ mountain.title }}</span>
                        </dd>
                      </div>
                    </div>
                  </dl>
                </div>
                <div v-else>
                  <p class="column yetiform-info">Les massifs n’ont pas pu être chargés</p>
                </div>
              </div>
            </div>

            <h2 class="title is-3 yeti-title">
              Méthodes
            </h2>
            <div class="columns is-mobile yetitabs">
              <div
                v-for="item of Object.keys(methods)"
                :key="item"
                class="column yetitab">
                <div
                  class="control yetitab-control"
                  :class="{'yetitab-control--selected': method===item}">
                  <input
                    :id="'c2c-method-' + item"
                    type="radio"
                    class="is-checkradio is-primary"
                    :value="item"
                    v-model="method"
                    :disabled="item === 'mrd' ? bra.high == 4 || bra.low == 4 : false">
                  <label
                    :for="'c2c-method-' + item"
                    class="yetitab-label"
                    @click="warnAboutMethodBra(item)">
                    {{ methods[item][0] }}
                    <span class="yetiform-info">{{ methods[item][1] }}</span>
                  </label>
                </div>
              </div>
            </div>

            <div v-show="method=='mrd'">
              <p>
                Avec la <strong>méthode de réduction pour débutant</strong> (MRD), vous n’avez pas d’autres paramètres à entrer que le (ou les) niveau(x) de danger donné par le BRA.
              </p>
              <div class="yetiform-note">
                <p>Comme son nom l’indique, cette méthode est destinée aux pratiquants débutants. De ce fait, la marge de sécurité se doit d'être très importante. On ne spécifie pas d’autre paramètre que le niveau de danger du BRA. Il n’est pas tenu compte de l’orientation.</p>
              </div>

              <table class="yetiform-danger">
                <tr>
                  <td><img src="@/assets/img/yeti/levels-danger.svg#level1"></td>
                  <td><strong>Danger faible</strong></td>
                  <td>Je renonce aux pentes > 40°</td>
                </tr>
                <tr>
                  <td><img src="@/assets/img/yeti/levels-danger.svg#level2"></td>
                  <td><strong>Danger limité</strong></td>
                  <td>Je renonce aux pentes > 35°</td>
                </tr>
                <tr class="multiline">
                  <td><img src="@/assets/img/yeti/levels-danger.svg#level3"></td>
                  <td><strong>Danger marqué</strong></td>
                  <td>Je renonce aux pentes > 30° <br><small>y compris les pentes qui me dominent</small></td>
                </tr>
                <tr>
                  <td><img src="@/assets/img/yeti/levels-danger.svg#level4"></td>
                  <td><strong>Danger fort à très fort</strong></td>
                  <td>Je renonce à sortir</td>
                </tr>
              </table>
            </div>

            <div v-show="method=='mre'">
              <p>
                Avec la <strong>méthode de réduction élémentaire</strong> (MRE), vous pouvez saisir les secteurs sur la rose des vents qui d’après le BRA constituent des orientations critiques.
              </p>

              <input-orientation v-model="orientation" class="has-text-centered" />
              <p v-if="orientation.length != 0" class="yetiform-info">Orientations: {{ orientation.join(', ') }}</p>
              <p v-else class="yetiform-info">Pas d’orientations sélectionnées</p>

              <div class="yetiform-note">
                <p>On notera que toutes les orientations possèdent le niveau de danger du BRA, avec un caractère plus critique dans les pentes sélectionnées sur la rose des vents.</p>
              </div>

              <table class="yetiform-danger">
                <tr>
                  <td><img src="@/assets/img/yeti/levels-danger.svg#level1"></td>
                  <td><strong>Danger faible</strong></td>
                  <td>Je renonce aux pentes > 45°</td>
                </tr>
                <tr>
                  <td><img src="@/assets/img/yeti/levels-danger.svg#level2"></td>
                  <td><strong>Danger limité</strong></td>
                  <td>Je renonce aux pentes > 40°</td>
                </tr>
                <tr class="multiline">
                  <td><img src="@/assets/img/yeti/levels-danger.svg#level3"></td>
                  <td><strong>Danger marqué</strong></td>
                  <td>Je renonce aux pentes > 35° <br><small>y compris les pentes qui me dominent</small></td>
                </tr>
                <tr class="multiline">
                  <td><img src="@/assets/img/yeti/levels-danger.svg#level4"></td>
                  <td><strong>Danger fort</strong></td>
                  <td>Je renonce aux pentes > 30° <br><small>y compris les pentes qui me dominent</small></td>
                </tr>
                <tr>
                  <td><img src="@/assets/img/yeti/levels-danger.svg#level4"></td>
                  <td><strong>Danger très fort</strong></td>
                  <td>Je renonce à sortir</td>
                </tr>
              </table>
            </div>

            <div v-show="method=='mrp'">
              <p>
                Avec la <strong>méthode de réduction professionnelle</strong> (MRP), vous pouvez affiner le potentiel de danger, tenir compte de la taille du groupe et des mesures de précaution envisagées.
              </p>

              <h3 class="title is-3">Potentiel de danger</h3>

              <ul class="potential-danger-labels has-text-black">
                <li
                  v-for="label of potentialDangerLabels"
                  :key="label.text"
                  :disabled="!bra.high || (label.text < potentialDangerOptions.min || label.text > potentialDangerOptions.max)"
                  :selected="potentialDanger == label.text"
                  class="potential-danger-label is-size-5"
                  @click="potentialDanger = label.text">
                  <span :class="{'is-size-3 has-text-weight-bold': label.val}">
                    {{ label.text }}
                  </span>
                </li>
              </ul>

              <p v-if="potentialDanger" class="yetiform-info">Potentiel de danger: {{ potentialDanger }} (BRA: {{ bra.high }})</p>
              <p v-else class="yetiform-info">Pas de potentiel de danger sélectionné. Entrez d’abord le BRA</p>

              <div class="yetiform-note">
                <p>Le potentiel de danger est calculé à partir du niveau de danger du BRA. Il peut être affiné en sélectionnant un potentiel dans la plage correspondant au niveau du BRA. Par exemple: Le BRA évoque un danger 3 juste après une période en danger 4. On pourra alors indiquer un potentiel de danger de 12 au lieu de 8.</p>
              </div>

              <p>
                <input-checkbox v-model="wetSnow">
                  Neige mouillée : pas de prise en compte de l’orientation
                </input-checkbox>
              </p>

              <div class="yetiform-note">
                <p>Attention, par neige mouillée, aucun facteur de réduction d’orientation ou de fréquentation ne peut être appliqué.</p>
              </div>

              <h3 class="title is-3">Groupe</h3>

              <ul>
                <li class="control" v-for = "(item, i) of groupSizes" :key="i">
                  <input
                    :id="'c2c-group-size-' + i"
                    type="radio"
                    class="is-checkradio is-primary"
                    v-model="groupSize"
                    :value="item.value">
                  <label :for="'c2c-group-size-' + i">{{ item.text }}</label>
                </li>
              </ul>

              <div class="yetiform-note">
                <p>Taille du groupe</p>
                <ul class="content-ul">
                  <li>Grand groupe = 5 personnes et plus</li>
                  <li>Petit groupe = 2 à 4 personnes</li>
                </ul>
                <p>Distances de délestage</p>
                <ul class="content-ul">
                  <li>10 mètres au minimum à la montée</li>
                  <li>50 mètres à la descente</li>
                </ul>
              </div>

              <p>
                Le facteur "pente parcourue fréquemment" n’est pas pris en compte par l’outil car cet aspect ne peut être constaté que sur le terrain.
              </p>

            </div>

            <div class="columns yetiform-validation" v-show="method">
              <div class="column has-text-right">
                <validation-button
                  :current-error="currentError"
                  :loading="promise"
                  @click="compute" />
              </div>
            </div>
          </div>

          <div class="box yeti-logos">
            <div class="columns is-mobile is-vcentered">
              <div class="column has-text-centered">
                <a href="http://www.ensg.eu">
                  <img src="@/assets/img/yeti/logo-ensg.png" alt="Logo ENSG" width="120">
                </a>
              </div>
              <div class="column has-text-centered">
                <a href="https://www.petzl.com/fondation/fondation-petzl?language=fr">
                  <img src="@/assets/img/yeti/logo-fondation-petzl.jpg" alt="Logo Fondation Petzl" width="90">
                </a>
              </div>
            </div>
          </div>
        </div>

        <div class="column map-container">
          <div class="legend">
            <div>
              <div class="legend-button is-pulled-right ol-control">
                <button type="button" @click="showLegend=!showLegend"><span>Légende</span></button>
              </div>
            </div>
            <div class="legend-content" v-show="showLegend === true">
              <p class="is-italic" v-if="!mapLegend">
                La légende apparaitra automatiquement avec l’image générée
              </p>
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
                :interval=".01"
                tooltip="none"
                direction="btt"
                :rail-style="{background: 'rgba(0,0,0,.25)'}"
                :process-style="{background: 'white'}"
                @change="onUpdateOpacityYetiLayer" />
            </div>
          </div>
          <map-view ref="map" @zoom="mapZoom = arguments[0]" show-recenter-on />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import ol from '@/js/libs/ol';
  import axios from 'axios';
  import vueSlider from 'vue-slider-component';
  import ValidationButton from '@/components/yeti/ValidationButton';
  import yetiText from '@/components/yeti/Text';

  const YETI_URL_BASE = 'https://api.ensg.eu/yeti-wps?request=Execute&service=WPS&version=1.0.0&identifier=Yeti&datainputs=';
  const YETI_URL_MOUNTAINS = '/mountains_WGS84.json';

  const YETI_ATTRIBUTION = 'Données RGE ALTI®';

  const VALID_FORM_DATA = {
    minZoom: 13,
    braMaxMrd: 3
  };

  const DANGER = {
    min: 1,
    max: 16,
    bra: [
      { min: 1, max: 2, val: 2 },
      { min: 3, max: 6, val: 4 },
      { min: 6, max: 12, val: 8 },
      { min: 13, max: 16, val: 16 }
    ]
  };

  const OPACITY_LAYER = 0.75;

  const ERRORS = {
    'method': {
      'simple': 'Méthode manquante',
      'full': 'Veuillez sélectionner une méthode pour le calcul'
    },
    'method_bra': {
      'simple': 'Méthode et BRA incompatible',
      'full': 'La méthode MRD (débutant) est autorisée avec un BRA de 3 maximum. Choisissez la méthode MRE ou MRP'
    },
    'bra': {
      'simple': 'BRA manquant',
      'full': 'La valeur de BRA est manquante'
    },
    'altitude': {
      'simple': 'Altitude manquante',
      'full': 'L\'altitude est requise quand le BRA haut et bas sont différents'
    },
    'zoom': {
      'simple': 'Zoom carte trop important',
      'full': 'Veuillez zoomer au niveau ' + VALID_FORM_DATA.minZoom + ' minimum'
    },
    'ok': 'Le calcul peut être lancé :)',
    'yeti': 'Le service ne fonctionne pas actuellement',
    'yeti_prefix': 'YETI Service: ',
    'yeti_unauthorized': 'Vous devez être autorisé pour effectuer cette requête. Contactez les administrateurs du service si vous êtes intéressé.'
  };

  export default {

    name: 'Yeti',

    components: { vueSlider, ValidationButton, yetiText },

    data() {
      return {
        showDisclaimer: false,
        checkDisclaimer: false,
        methods: {
          mrd: ['MRD', 'Débutant'],
          mre: ['MRE', 'Élémentaire'],
          mrp: ['MRP', 'Expert']
        },
        groupSizes: [
          {
            value: 1,
            text: 'Aucun facteur de réduction lié au groupe'
          },
          {
            value: 2.1,
            text: 'Grand groupe avec distance de délestage'
          },
          {
            value: 2.2,
            text: 'Petit groupe sans distance'
          },
          {
            value: 3,
            text: 'Petit groupe avec distance de délestage'
          }
        ],
        method: null,
        wetSnow: false,
        groupSize: 1,
        potentialDanger: undefined,
        bra: {
          high: null,
          low: null,
          altiThreshold: null,
          isDifferent: false
        },
        orientation: [],
        mapZoom: false,
        formError: undefined,
        currentError: undefined,

        promise: null,
        yetiLayer: null,
        opacityYetiLayer: OPACITY_LAYER,
        showLegend: undefined,
        mapLegend: null,
        extentLayer: null,

        mountains: {},
        visibleMountains: {},
        promiseMountains: null,
        showMountainsList: false
      };
    },

    computed: {
      potentialDangerLabels() {
        const result = [];
        for (let i = DANGER.min; i <= DANGER.max; i++) {
          const data = { text: i };
          if (i === 2 || i === 4 || i === 8 || i === 16) {
            data.val = i;
          }
          result.push(data);
        }

        return result;
      },

      potentialDangerOptions() {
        if (!this.bra.high) {
          return { val: undefined, min: 1, max: 16 };
        }

        return DANGER.bra[this.bra.high - 1];
      },

      mrdIsNotApplicable() {
        return this.isBraMax && this.method === 'mrd';
      },

      isBraMax() {
        return (this.bra.high > VALID_FORM_DATA.braMaxMrd || this.bra.low > VALID_FORM_DATA.braMaxMrd);
      },

      isValidMapZoom() {
        return this.mapZoom >= VALID_FORM_DATA.minZoom;
      },

      countVisibleMountains() {
        return Object.values(this.visibleMountains).reduce((a, b) => a + b.length, 0);
      }

    },

    watch: {
      'bra.high': 'onBraChange',
      'bra.low': 'check',
      'bra.altiThreshold': 'check',
      'bra.isDifferent': ['check', 'checkBraIsDifferent'],
      'method': 'check',
      'mapZoom': 'check'
    },

    created() {
      // show disclaimer if not already validated
      if (!this.$localStorage.get('yeti-disclaimer')) {
        this.showDisclaimer = true;
      }
    },

    mounted() {
      this.check();

      // mountains
      this.$refs.map.map.on('moveend', this.onMapMoveEnd);
      axios.get(YETI_URL_MOUNTAINS)
        .then(this.onMountainsResult)
        .catch(this.onMountainsError);
    },

    methods: {
      check() {
        if (!this.bra.high) {
          this.formError = 'bra';
        } else if (this.bra.low && this.bra.high !== this.bra.low && !this.bra.altiThreshold) {
          this.formError = 'altitude';
        } else if (!this['method']) {
          this.formError = 'method';
        } else if (this.mrdIsNotApplicable) {
          this.formError = 'method_bra';
        } else if (!this.isValidMapZoom) {
          this.formError = 'zoom';
        } else {
          this.formError = null;
        }
        // also
        // verif if bra = 4, method MRD forbidden
        if (this.mrdIsNotApplicable) {
          this.method = null;
        }

        // then set errors
        this.setCurrentError();
      },

      checkBraIsDifferent() {
        if (!this.bra.isDifferent) {
          this.bra.low = null;
          this.bra.altiThreshold = null;
        }
      },

      onBraChange() {
        this.potentialDanger = this.potentialDangerOptions.val;
        this.check();
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
            this.currentError += ' (actuel: ' + this.mapZoom + ')';
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

        this.drawExtent(extendedExtent);

        const yetiUrl = this.getYetiUrl(extendedExtent);

        // if layer already exist, remove it
        if (this.yetiLayer) {
          this.yetiLayer.setMap(null);
          this.yetiLayer = null;

          // set default opacity
          this.opacityYetiLayer = OPACITY_LAYER;
        }

        // fetch img
        this.promise = axios.get(yetiUrl)
          .then(this.onYetiResult)
          .catch(this.onYetiError);
      },

      toLinearRing(extent) {
        const minX = extent[0];
        const minY = extent[1];
        const maxX = extent[2];
        const maxY = extent[3];
        return [[minX, minY], [minX, maxY], [maxX, maxY], [maxX, minY], [minX, minY]];
      },

      drawExtent(extent) {
        // extend extent
        const extentFill = ol.extent.buffer(extent, 1000);
        // then, create a donut polygon
        const polygon = new ol.Feature(
          new ol.geom.Polygon([
            this.toLinearRing(extentFill),
            this.toLinearRing(extent)
          ])
        );
        // remove old layer if exists
        if (this.extentLayer) {
          this.extentLayer.setMap(null);
          this.extentLayer = null;
        }
        // create extent layer
        this.extentLayer = new ol.layer.Vector({
          source: new ol.source.Vector({
            features: [polygon]
          }),
          style: [
            new ol.style.Style({
              fill: new ol.style.Fill({ color: 'rgba(255,153,51,.45)' })
            }),
            new ol.style.Style({
              stroke: new ol.style.Stroke({ stroke: 'rgba(0,0,0,.85)' }),
              geometry: feature => {
                return new ol.geom.Polygon([feature.getGeometry().getCoordinates()[1]]);
              }
            })
          ]
        });
        this.extentLayer.setMap(this.$refs.map.map);
      },

      extendExtent(extent) {
        const extendedFactor = Math.min(0.5, (this.mapZoom - VALID_FORM_DATA.minZoom) / 6);
        const extendedValue = Math.max(extent[2] - extent[0], extent[3] - extent[1]) * extendedFactor;
        return ol.extent.buffer(extent, extendedValue);
      },

      onYetiResult(result) {
        const xml = new DOMParser().parseFromString(result.data, 'application/xml');
        const imageBase64 = xml.getElementsByTagName('wps:ComplexData')[0].textContent;
        const imageBbox = xml.getElementsByTagName('wps:ComplexData')[1].textContent;
        const imageExtent = ol.proj.transformExtent(imageBbox.split(',').map(Number), 'EPSG:4326', 'EPSG:3857');

        this.yetiLayer = new ol.layer.Image({
          source: new ol.source.ImageStatic({
            url: '',
            imageLoadFunction(image, src) {
              image.getImage().src = 'data:image/png;base64,' + imageBase64;
            },
            imageExtent,
            attributions: YETI_ATTRIBUTION
          }),
          opacity: this.opacityYetiLayer
        });

        this.yetiLayer.setMap(this.$refs.map.map);

        // set map legend
        this.mapLegend = JSON.parse(xml.getElementsByTagName('wps:ComplexData')[2].textContent);
        this.mapLegend.items.forEach(item => {
          item.color = `rgb(${item.color[0]}, ${item.color[1]}, ${item.color[2]})`;
        });

        this.promise = null;
      },

      onYetiError(err) {
        this.promise = null;

        let errorText = ERRORS['yeti'];

        if (err.response.status === 400) {
          const xml = new DOMParser().parseFromString(err.data, 'application/xml');
          errorText = [...xml.getElementsByTagName('ExceptionText')].map(_ => _.textContent).join(' ');
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
        const compass = this.method === 'mre' && this.orientation.length !== 0 ? 'none,' + this.orientation.join(',').toLowerCase() : 'none';

        // mrp
        const potentialDanger = this.method === 'mrp' ? this.potentialDanger : 0;
        const wetSnow = this.method === 'mrp' ? this.wetSnow : false;
        const groupSize = this.method === 'mrp' ? Math.floor(this.groupSize) : 0;

        // create url
        let result = YETI_URL_BASE;
        result += `methode=${this.method};`;
        result += `bbox=${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]};`;
        result += `risque_haut=${this.bra.high};`;
        result += `risque_bas=${braLow};`;
        result += `seuil_alti=${braAltiThreshold};`;
        result += `rdv=${compass};`;
        result += `potentiel_danger=${potentialDanger};`;
        result += `neige_mouillee=${wetSnow};`;
        result += `taille_groupe=${groupSize}`;

        result += '&username=' + this.$user.forumUsername;

        return result;
      },

      onMapMoveEnd() {
        this.setVisibleMountains();
      },

      setVisibleMountains() {
        const mapExtent = this.$refs.map.getExtent('EPSG:4326');
        // clone this.mountains first, with no reference
        this.visibleMountains = Object.assign({}, this.mountains);
        // then filter if polygon isn’t in view
        for (const massif in this.visibleMountains) {
          this.visibleMountains[massif] = this.visibleMountains[massif].filter(mountain => {
            const polygon = mountain.geometry;
            return polygon.intersectsExtent(mapExtent);
          });
          // unset massif if empty
          if (this.visibleMountains[massif].length === 0) {
            delete this.visibleMountains[massif];
          }
        }
      },

      sortMountainsByMassif() {
        const sortedMountains = {};
        for (let i = 0; i < this.mountains.length; i++) {
          if (!sortedMountains[this.mountains[i].mountain]) {
            sortedMountains[this.mountains[i].mountain] = [];
          }
          sortedMountains[this.mountains[i].mountain].push(this.mountains[i]);
        }
        this.mountains = sortedMountains;
      },

      onMountainsResult(data) {
        const features = data.data;
        this.mountains = (new ol.format.GeoJSON()).readFeatures(features).map(mountain => {
          return mountain.getProperties();
        });
        this.sortMountainsByMassif();
        this.setVisibleMountains();

        this.promiseMountains = true;
      },

      onMountainsError() {
        // silent error
        this.promiseMountains = null;
      },

      onSubmitDisclaimer() {
        this.showDisclaimer = false;
        this.$localStorage.set('yeti-disclaimer', 'validated');
      }
    }
  };
</script>

<style scoped lang="scss">

  @import '@/assets/sass/variables.scss';

  $section-padding: 1.5rem; //TODO find this variable
  $box-padding: 1.25rem; //TODO find this variable
  $header-height : 34px;
  $box-margin: 1.5rem; //TODO find this variable
  $yeti-height : calc(100vh - #{$navbar-height} - #{$section-padding} - 2*#{$box-padding} - #{$header-height} - #{$box-margin} - #{$box-margin});

  .yeti-app {
    position: relative;
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
          padding: 0 .5em;
        }
      }

      .legend-content {
        margin-top: 0.5rem;
        margin-left: 1.25rem;
        border-radius: 2px;
        border: 1px solid lightgray;
        padding:0.5rem;
        background: white;
        clear:both;
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
        background: rgba(0,60,136,0.5);
        border-radius: 2px;

        &:hover {
          background: rgba(0,60,136,0.7);
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
      padding-left:0;
      padding-top:0;
      padding-bottom:0;

      .legend {
        top: .5rem;

        .legend-content {
          margin-left: .5rem;
        }
      }

      .opacity {
        top: 2.75rem;
      }
    }

    .mobile-result-map {
      margin-top:0;
      height:$yeti-height;

      .documents-container {
        display:None;
      }
    }

    .mobile-result-card {
      .map-container{
        visibility: hidden; // map does not like to be in a display none...
      }
    }
  }

  @media screen and (min-width: $tablet){
    .yeti-content {
      height:$yeti-height;

      .form-container {
        height:100%;
        overflow: auto;
      }

      .map-container {
        min-height: 100%;
      }
    }
  }

  p:not(:last-child), ul:not(:last-child), table:not(:last-child) {
    margin-bottom: 1rem;
  }

  a:hover,
  a:focus {
    text-decoration: underline;
  }

  h4 {
    margin-top: 1rem;
    margin-bottom: 0.25rem!important;
  }

  abbr {
    text-decoration: none;
    border-bottom: dotted 2px #aaa;
  }

  strong,
  dt {
    font-weight: bold;
    color: $grey;
  }

  .content-ul {
    list-style: disc outside;
    margin-left: 2em;
  }

  .yeti-title {
    display: inline-block;
    margin-left: -1.25rem;
    padding: .25em 1.25rem;
    background: $grey-lighter;
  }

  .inputs-bra {
    margin-left:2rem;
    position: relative;

    .input-bra-high {
      position:absolute;
      left: 39px;
      top: 62px;
    }

    .input-bra-threshold {
      position:absolute;
      left: 115px;
      top: 60px;
      width: 85px;
    }

    .input-bra-low {
      position:absolute;
      left: 39px;
      top: 78px;
    }
  }

  .inputs-bra-different {
    .input-bra-high {
      top: 45px;
    }
  }

  .yetiform-danger {
    width: 100%;
    table-layout: fixed;
    color: $dark;
    background-color: $white-ter;

    tr {
      border: 1px solid $white;
      border-left: 0;
      border-right: 0;
    }

    td {
      vertical-align: middle;
      height: 45px;
    }

    .multiline td {
      vertical-align: baseline;
    }

    td:first-child {
      width: 60px;
    }

    td:first-child + td {
      width: 40%;
    }

    td img {
      vertical-align: -12px;
      height: 35px;
    }
  }

  .yetiform-note {
    position: relative;
    font-size: 0.9em;
    padding: 1em;
    padding-left: 4em;
    margin-bottom: 2em;
    background-color: $white-ter;
    border-radius: 2px;
  }

  .yetiform-note::before {
    content: '?';
    position: absolute;
    top: 1em;
    left: 1em;
    color: white;
    font-size: 1.14em;
    font-weight: bold;
    text-align: center;
    height: 1.375em;
    width: 1.375em;
    line-height: 1.4em;
    background-color: rgba(0, 60, 136, 0.5);
    border-radius: 2px;
  }

  .yetitabs {
    margin: 0;
    padding: .75rem 0;
  }

  .yetitab {
    padding: 0;
  }

  .yetitab-control {
    .yetitab-label {
      display: block;
      margin: 0;
      padding: .25rem;
      padding-left: 2rem;
      border: 1px solid transparent;
      border-radius: 4px;

      &:hover,
      &:focus {
        border-color: $grey-lighter;
      }

      &.yetitab-label:before {
        top: .25rem !important;
        left: .25rem !important;
      }
      &.yetitab-label:after {
        top: 1em !important;
        left: 1em !important;
      }
    }

    .is-checkradio:checked + label:after {
      top: .25rem !important;
      left: .25rem !important;
    }
  }

  .yetitab-control--selected {
    .yetitab-label {
      color: $primary;
      border-color: $primary;

      &:hover,
      &:focus {
        border-color: $primary;
      }
    }
  }

  @media screen and (max-width: 490px),
         screen and (min-width: $tablet) and (max-width: 970px),
         screen and (min-width: $desktop) and (max-width: 1180px),
         screen and (min-width: $widescreen) and (max-width: 1370px),
         screen and (min-width: $fullhd) and (max-width: 1650px) {
    .yetitabs {
      flex-wrap: wrap;
    }
    .yetitab {
      flex: 0 0 50%;
    }
    .yetiform-danger tr,
    .yetiform-danger td {
      display: block;
    }
    .yetiform-danger tr {
      padding: .5em 0;
    }
    .yetiform-danger td:first-child {
      float: left;
    }
    .yetiform-danger td:first-child ~ td {
      height: auto;
      width: calc(100% - 60px);
      margin-left: 60px;
    }
  }

  .potential-danger-labels {
    display: flex;
    align-items: stretch;
    user-select: none;
    background: linear-gradient(to right, #bfe12b, #bfe12b 12%, #fff200 20%, #fff200 32%, #f68712 40%, #f68712 72%, #ed1c24 80%, #ed1c24 95%, #c01a2c);

    .potential-danger-label {
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      flex: 1 1 20px;
      text-align: center;
      border: 3px solid transparent;
    }

    .potential-danger-label[disabled] {
      cursor: not-allowed;
      pointer-events: none;
      background-color: rgba(255,255,255,0.8);
      color:grey;
    }

    .potential-danger-label[selected] {
      border-color: black;
    }
  }

  .yetiform-validation {
    margin-top: 1rem;
  }

  .yetimountains {
    margin-bottom: 2rem;
    border: 1px solid #dbdbdb;
    border-radius: 4px;

    &:hover {
      border-color: #b5b5b5;
    }
  }

  .yetimountains-title {
    cursor: pointer;
    padding: .25rem .75rem;
  }

  .yetimountains-count {
    display: inline-block;
    width: 1.1rem;
    height: 1.1rem;
    line-height: 1rem;
    vertical-align: .1rem;
    margin-left: 1rem;
    background: $grey;
    color: $white;
    border-radius: 50%;
    font-size: .7em;
    text-align: center;
  }

  .yetimountains-arrow {
    color: $primary;
    margin-top: .25rem;
  }

  .yetimountains-list {
    columns: 3 170px;
    padding: .75rem 2rem;
  }

  .yetimountains-listtitle {
    font-weight: bold;
    padding: 0 .75rem;
  }

  .yetimountains-listelement + .yetimountains-listtitle {
    margin-top: .5rem;
  }

  .yetiform-info {
    font-size: 0.8em;
    opacity: 0.75;
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
    top: .75rem;
    right: 0;
    left: 0;
    min-height: 100%;
  }
</style>

<style lang="scss">
  /* Not scoped styles */
  .yeti-app {
    .input-orientation {
      width: 120px;
      height: 120px;
    }
    .control--bradifferent .is-checkradio[type=checkbox] + label {
      margin: 0;
    }
  }
</style>
