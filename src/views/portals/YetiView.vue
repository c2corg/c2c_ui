<template>
  <div class="section has-background-light">
    <html-header title="Yeti"/>
    <div class="box">
      <h1 class="title is-1">
        <span v-translate>YETI - Un outil pour la vie</span>
        <span class="is-pulled-right has-text-primary">
          <fa-icon icon="map-marked-alt" />
        </span>
      </h1>
    </div>

    <div class="columns yeti-content">
      <div class="column is-7 form-container">
        <div class="box">
          <h2 class="title is-2">
            <a class="is-size-6 is-pulled-right" href="/    yeti_faq.pdf">FAQ ?</a>
            <span>Info BRA</span>
          </h2>
          <div class="columns">
            <div class="column">
              <div class="inputs-bra" :class="{'inputs-bra-different' : bra.isDifferent}">
                <svg viewBox="0 0 100 100" width="150" height="150">
                  <polygon style="fill:none;stroke:#000;stroke-miterlimit:10;" points="2.2,89.5 97.5,89.5 62.7,11.9 48,32.9 31.8,25.5 "/>
                  <line v-show="bra.isDifferent" style="fill:none;stroke:#000;stroke-miterlimit:10;" x1="10" y1="61.5" x2="90" y2="61.5"/>
                </svg>
                <div class="input-bra-high select">
                  <select
                    v-model="bra.high"
                    class="form-control"
                    aria-label="Niveau de risque BRA haut">
                    <option :value="null" selected/>
                    <option :value="1">1</option>
                    <option :value="2">2</option>
                    <option :value="3">3</option>
                    <option :value="4" :disabled="method==='mrd'">4</option>
                  </select>
                </div>

                <div v-show="bra.isDifferent" class="input-bra-threshold control">
                  <input
                    class="input"
                    type="number"
                    step="50"
                    v-model="bra.altiThreshold"
                    maxlength="4"
                    aria-label="Altitude seuil">
                </div>

                <div v-show="bra.isDifferent" class="input-bra-low select">
                  <select v-model="bra.low" aria-label="Niveau de risque BRA bas">
                    <option :value="null" selected/>
                    <option :value="1">1</option>
                    <option :value="2">2</option>
                    <option :value="3">3</option>
                    <option :value="4" :disabled="method==='mrd'">4</option>
                  </select>
                </div>
              </div>

              <div>
                <input-checkbox v-model="bra.isDifferent">
                  BRA haut/bas différents ?
                </input-checkbox>
              </div>
            </div>

            <div class="column has-text-centered">
              <button
                class="button is-primary"
                :class="{'is-loading': promise}"
                :disabled="formError"
                @click="compute">
                Voir sur la carte
              </button>
              <p v-if="currentError">
                <span>
                  <strong>Info: </strong>
                  {{ currentError }}
                </span>
              </p>
            </div>

          </div>

          <h2 class="title is-2">
            Méthodes
          </h2>
          <div class="columns is-mobile">
            <div
              v-for="item of Object.keys(methods)"
              :key="item" class="column">
              <div
                class="control method-input"
                :class="{'has-background-secondary has-text-light has-text-weight-bold': method===item}">
                <input :id="'c2c-method-' + item" type="radio" class="is-checkradio" :value="item" v-model="method" :disabled="item=='mrd' ? bra.high == 4 : false">
                <label :for="'c2c-method-' + item">{{ methods[item] }}</label>
              </div>
            </div>
          </div>

          <div v-show="method=='mrd'">
            <p>
              Avec la Méthode de Réduction pour Débutant (MRD), vous n'avez pas d'autres paramètres à entrer que le (ou les) niveau(x) de risque donné par le BRA.
            </p>
            <p class="is-italic">
              Comme son nom l'indique, cette méthode est destinée aux pratiquants débutants. De ce fait, la marge de securité se doit d'être très importante. On ne spécifie pas d'autre paramètre que le niveau de risque du BRA. Il n'est pas tenu compte de l'orientation.
            </p>

            <table class="yetiForm-danger">
              <tr class="yetiForm-danger--low">
                <td><img src="@/assets/img/yeti/levels-danger.svg#level1"></td>
                <td>Danger faible</td>
                <td>Pente &lt;40°</td>
                <td><img src="@/assets/img/yeti/levels-danger-slope.svg#level1"></td>
              </tr>
              <tr class="yetiForm-danger--medium">
                <td><img src="@/assets/img/yeti/levels-danger.svg#level2"></td>
                <td>Danger limité</td>
                <td>Pente &lt;35°</td>
                <td><img src="@/assets/img/yeti/levels-danger-slope.svg#level2"></td>
              </tr>
              <tr class="yetiForm-danger--strong">
                <td><img src="@/assets/img/yeti/levels-danger.svg#level3"></td>
                <td>Danger marqué</td>
                <td>Pente &lt;30°</td>
                <td><img src="@/assets/img/yeti/levels-danger-slope.svg#level3"></td>
              </tr>
              <tr class="yetiForm-danger--high">
                <td><img src="@/assets/img/yeti/levels-danger.svg#level4"></td>
                <td>Danger fort</td>
                <td>Renoncer à sortir</td>
                <td><img src="@/assets/img/yeti/levels-danger-slope.svg#level4"></td>
              </tr>
            </table>
          </div>

          <div v-show="method=='mre'">
            <p>
              Avec la Méthode de Réduction élémentaire (MRE), vous pouvez saisir les secteurs sur la rose des vents qui d'apres le BRA consitituent des orientations critiques.
            </p>

            <p>
              <input-orientation v-model="orientation" class="has-text-centered"/>
            </p>

            <p class="is-italic">
              On notera que toutes les orientations possèdent le niveau de risque du BRA, avec un caractère plus critique dans les pentes sélectionnées sur la rose des vents.
            </p>

            <table class="yetiForm-danger">
              <tr class="yetiForm-danger--low">
                <td><img src="@/assets/img/yeti/levels-danger.svg#level1"></td>
                <td>Danger faible</td>
                <td>Skier avec précaution</td>
                <td/>
              </tr>
              <tr class="yetiForm-danger--medium">
                <td><img src="@/assets/img/yeti/levels-danger.svg#level2"></td>
                <td>Danger limité</td>
                <td>Pente &lt;40°</td>
                <td><img src="@/assets/img/yeti/levels-danger-slope.svg#level1"></td>
              </tr>
              <tr class="yetiForm-danger--strong">
                <td><img src="@/assets/img/yeti/levels-danger.svg#level3"></td>
                <td>Danger marqué</td>
                <td>Pente &lt;35°</td>
                <td><img src="@/assets/img/yeti/levels-danger-slope.svg#level2"></td>
              </tr>
              <tr class="yetiForm-danger--high">
                <td><img src="@/assets/img/yeti/levels-danger.svg#level4"></td>
                <td>Danger fort</td>
                <td>Pente &lt;30°</td>
                <td><img src="@/assets/img/yeti/levels-danger-slope.svg#level3"></td>
              </tr>
              <tr class="yetiForm-danger--insane">
                <td><img src="@/assets/img/yeti/levels-danger.svg#level4"></td>
                <td>Danger très fort</td>
                <td>Renoncer à sortir</td>
                <td><img src="@/assets/img/yeti/levels-danger-slope.svg#level4"></td>
              </tr>
            </table>
          </div>

          <div v-show="method=='mrp'">
            <p>
              Avec la Méthode de Réduction Professionnelle (MRP), vous pouvez affiner le potentiel de danger, tenir compte de la taille du groupe et des mesures de précaution envisagées.
            </p>

            <h3 class="title is-3">Potentiel de danger</h3>
            <p v-if="bra.high">BRA actuel: {{ bra.high }}</p>
            <p v-else>Pas de BRA sélectionné</p>

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

            <p class="is-italic">
              Le potentiel de danger est calculé à partir du niveau de risque du BRA. Il peut être affiné en agissant directement sur le slider. Par exemple: Le BRA évoque un risque 3 juste après une période en risque 4. On pourra alors indiquer un potentiel de danger de 12 au lieu de 8.
            </p>

            <p>
              <input-checkbox v-model="wetSnow">
                Neige mouillée: pas de prise en compte de l'orientation
              </input-checkbox>
            </p>

            <p class="is-italic">
              Attention, par neige mouillée, aucun facteur de réduction d'orientation ou de fréquentation ne peut être appliqué.
            </p>

            <h3 class="title is-3">Groupe</h3>

            <ul>
              <li class="control" v-for = "(item, i) of groupSizes" :key="i">
                <input :id="'c2c-group-size-' + i" type="radio" class="is-checkradio" v-model="groupSize" :value="item.value">
                <label :for="'c2c-group-size-' + i">{{ item.text }}</label>
              </li>
            </ul>

            <h4 class="title is-4">Taille du groupe</h4>

            <ul class="content-ul">
              <li>Grand groupe = 5 personnes et plus</li>
              <li>Petit groupe = 2 à 4 personnes</li>
            </ul>
            <h4 class="title is-4">Distances de sécurité</h4>
            <ul class="content-ul">
              <li>10 mètres au minimum à la montée</li>
              <li>50 mètres à la descente</li>
            </ul>

            <p>
              Le facteur "pente parcourue fréquemment" n'est pas pris en compte par l'outil car cet aspect ne peut être constaté que sur le terrain.
            </p>

          </div>
        </div>

        <div class="box yeti-logos">
          <div class="columns">
            <div class="column has-text-centered">
              <a href="http://www.ensg.eu">
                <img src="@/assets/img/yeti/logo-ensg.png" alt="Logo ENSG">
              </a>
            </div>
            <div class="column has-text-centered">
              <a href="http://www.geoportail.gouv.fr">
                <img src="@/assets/img/yeti/logo-geoportail.png" alt="Logo Geoportail IGN">
              </a>
            </div>
            <div class="column has-text-centered">
              <a href="https://www.petzl.com/fondation/fondation-petzl?language=fr">
                <img src="@/assets/img/yeti/logo-fondation-petzl.jpg" alt="Logo Fondation Petzl">
              </a>
            </div>
          </div>
        </div>
      </div>

      <div class="column is-5 map-container">
        <div class="legend">
          <div>
            <div class="legend-button is-pulled-right ol-control">
              <button type="button" @click="showLegend=!showLegend"><span>?</span></button>
            </div>
          </div>
          <div class="legend-content" v-show="showLegend === true">
            <p class="is-italic" v-if="!mapLegend">
              La légende apparaîtra automatiquement avec l'image générée
            </p>
            <div v-else>
              <ul>
                <li v-for="(item, i) of mapLegend.items" :key="i">
                  <span class="legend-color" :style="'background:' + item.color"/>
                  <span>{{ item.text['fr'] }}</span>
                </li>
              </ul>
              <p class="is-size-6 is-italic">{{ mapLegend.comment['fr'] }}</p>
            </div>
          </div>
        </div>
        <map-view ref="map" @zoom="mapZoom = arguments[0]"/>
      </div>
    </div>
  </div>
</template>

<script>
  import ol from '@/js/libs/ol';
  import axios from 'axios';
  import vueSlider from 'vue-slider-component';

  const YETI_URL_BASE = 'https://api.ensg.eu/yeti-wps?request=Execute&service=WPS&version=1.0.0&identifier=Yeti&datainputs=';

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
      { min: 7, max: 12, val: 8 },
      { min: 13, max: 16, val: 16 }
    ]
  };

  const ERRORS = {
    'method': {
      'simple': 'Méthode manquante',
      'full': 'Veuillez sélectionner une méthode pour le calcul'
    },
    'method_bra': {
      'simple': 'Méthode et BRA incompatible',
      'full': 'La méthode MRD (débutant) est autorisée avec un BRA de 3 maximum'
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
    'ok': 'Tout semble correct :)',
    'yeti': 'Le service ne fonctionne pas actuellement',
    'yeti_prefix': 'YETI Service: ',
    'yeti_unauthorized': 'Vous devez être autorisé pour effectuer cette requête. Contactez les administrateurs du service si vous êtes intéressé.'
  };

  export default {
    components: { vueSlider },

    data() {
      return {
        methods: {
          mrd: 'MRD (débutant)',
          mre: 'MRE (élémentaire)',
          mrp: 'MRP (expert)'
        },
        groupSizes: [
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
          },
          {
            value: 1,
            text: 'Aucun facteur de réduction lié au groupe'
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
        showLegend: undefined,
        mapLegend: null,

        label: {

        },
        item: {
          text: {

          }
        }
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
        return this.bra.high > VALID_FORM_DATA.braMaxMrd && this.method === 'mrd';
      },

      isValidMapZoom() {
        return this.mapZoom >= VALID_FORM_DATA.minZoom;
      }
    },

    watch: {
      'bra.high': 'onBraChange',
      'bra.low': 'check',
      'bra.altiThreshold': 'check',
      'bra.isDifferent': 'check',
      'method': 'check',
      'mapZoom': 'check'
    },

    mounted() {
      this.check();
    },

    methods: {
      check() {
        if (!this.bra.high) {
          this.formError = 'bra';
        } else if (!this['method']) {
          this.formError = 'method';
        } else if (this.mrdIsNotApplicable) { // technically, can't happen
          window.alert(ERRORS.method_bra.full);
          this.method = null;
          this.formError = 'method';
        } else if (this.bra.low && this.bra.high !== this.bra.low && !this.bra.altiThreshold) {
          this.formError = 'altitude';
        } else if (!this.isValidMapZoom) {
          this.formError = 'zoom';
        } else {
          this.formError = null;
        }

        // then set errors
        this.setCurrentError();
      },

      onBraChange() {
        this.potentialDanger = this.potentialDangerOptions.val;
        this.check();
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
        const bbox = this.$refs.map.getExtent('EPSG:4326');
        const yetiUrl = this.getYetiUrl(bbox);

        // if layer already exist, remove it
        if (this.yetiLayer) {
          this.yetiLayer.setMap(null);
        }

        // fetch img
        this.promise = axios.get(yetiUrl)
          .then(this.onYetiResult)
          .catch(this.onYetiError);
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
            imageExtent
          }),
          opacity: 0.75
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

        if (err.status === 400) {
          const xml = new DOMParser().parseFromString(err.data, 'application/xml');
          errorText = [...xml.getElementsByTagName('ExceptionText')].map(_ => _.textContent).join(' ');
        }

        if (err.status === 403) {
          errorText = ERRORS['yeti_unauthorized'];
        }

        window.alert(ERRORS['yeti_prefix'] + errorText);
      },

      getYetiUrl(bbox) {
        // set bra.low / altiThreshold
        const braLow = this.bra['low'] || this.bra.high;
        const braAltiThreshold = this.bra['altiThreshold'] || 0;

        // mre
        const compass = this.method === 'mre' ? this.orientation.join(',') : 'none';

        // mrp
        const potentialDanger = this.method === 'mrp' ? this.potentialDanger : 0;
        const wetSnow = this.method === 'mrp' ? this.wetSnow : false;
        const groupSize = this.method === 'mrp' ? this.groupSize : 0;

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

  .map-container{
    position: relative;

    .legend {
      position: absolute;
      z-index: 5;
      top:0;
      right:0;
      padding:1rem;

      .legend-button {
        position: unset;
      }

      .legend-content{
        margin-top: 0.5rem;
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
  }
  @media screen and (max-width: $tablet) {

    .map-container{
      height: $yeti-height;
      padding-left:0;
      padding-top:0;
      padding-bottom:0;
    }

    .mobile-result-map{
      margin-top:0;
      height:$yeti-height;

      .documents-container{
        display:None;
      }
    }

    .mobile-result-card{

      .map-container{
        visibility: hidden; // map does not like to be in a display none...
      }
    }
  }

  @media screen and (min-width: $tablet){
    .yeti-content{
      height:$yeti-height;

      .form-container{
        height:100%;
        overflow: auto;
      }

      .map-container{
        min-height: 100%;
      }
    }
  }

  p:not(:last-child), ul:not(:last-child), table:not(:last-child){
    margin-bottom: 1rem;
  }

  h4{
    margin-top: 1rem;
    margin-bottom: 0.25rem!important;
  }

  .content-ul {
    list-style: disc outside;
    margin-left: 2em;
  }

  .inputs-bra{
    margin-left:2rem;
    position: relative;

    .input-bra-high {
      position:absolute;
      left: 47px;
      top: 70px;
    }

    .input-bra-threshold{
      position:absolute;
      left: 140px;
      top: 75px;
      width: 85px;
    }

    .input-bra-low {
      position:absolute;
      left: 47px;
      top: 97px;
    }
  }

  .inputs-bra-different{
    .input-bra-high {
      top: 54px;
    }
  }

  .method-input{
    padding: 0.5rem;
  }

  .yetiForm-danger {
    width: 100%;
    table-layout: fixed;
    color:$dark;

    td{
      vertical-align: middle;
    }

    td:first-child,
    td:last-child {
      width: 100px;
      text-align: center;
    }

    td img {
      height: 50px;
    }

    .yetiForm-danger--low {
      background: #bfe12b;
    }

    .yetiForm-danger--medium {
      background: #fff200;
    }

    .yetiForm-danger--strong {
      background: #f68712;
    }

    .yetiForm-danger--high {
      background: #ed1c24;
    }

    .yetiForm-danger--insane {
      background: #c01a2c;
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

  .yeti-logos{
      img{
          height: 40px;
      }
  }
</style>
