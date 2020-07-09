<template>
  <div class="panelBRA">
    <div class="columns is-mobile">
      <div class="column">
        <div class="inputs-bra" :class="{ 'inputs-bra-different': bra.isDifferent }">
          <svg viewBox="0 0 100 100" width="120" height="120">
            <polygon
              style="fill: none; stroke: #000; stroke-miterlimit: 10;"
              points="2.2,89.5 97.5,89.5 62.7,11.9 48,32.9 31.8,25.5 "
            />
            <line
              v-show="bra.isDifferent"
              style="fill: none; stroke: #000; stroke-miterlimit: 10;"
              x1="10"
              y1="61.5"
              x2="90"
              y2="61.5"
            />
          </svg>
          <div class="input-bra-high select is-small">
            <select @change="onChange($event, 'high')" :value="bra.high" aria-label="Niveau de danger BRA haut">
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
              maxlength="4"
              aria-label="Altitude seuil"
              @change="onChange($event, 'altiThreshold')"
              :value="bra.altiThreshold"
            />
          </div>

          <div v-show="bra.isDifferent" class="input-bra-low select is-small">
            <select @change="onChange($event, 'low')" :value="bra.low" aria-label="Niveau de danger BRA bas">
              <option :value="null" selected />
              <option :value="1">1</option>
              <option :value="2">2</option>
              <option :value="3">3</option>
              <option :value="4">4</option>
            </select>
          </div>
        </div>

        <div>
          <input-checkbox
            @input="onChange($event, 'isDifferent')"
            :value="bra.isDifferent"
            class="control--bradifferent"
          >
            BRA haut/bas différents ?
          </input-checkbox>
        </div>
      </div>
    </div>

    <div class="yetimountains">
      <div>
        <p class="yetimountains-title" @click="showMountainsList = !showMountainsList">
          Bulletins BRA par massif
          <span v-if="promiseMountains" class="yetimountains-count">{{ countVisibleMountains }}</span>
          <fa-icon
            class="yetimountains-arrow is-size-6 is-pulled-right has-cursor-pointer no-print"
            icon="angle-down"
            :rotation="showMountainsList ? 180 : undefined"
          />
        </p>
      </div>
      <div v-if="showMountainsList">
        <div v-if="promiseMountains">
          <p class="column yetiform-info">Affichez les bulletins en PDF sur le site de Météo France</p>
          <dl>
            <div v-for="(mountainsForMassif, massif) of visibleMountains" :key="massif">
              <dt class="yetimountains-listtitle">
                {{ massif }}
              </dt>
              <div class="yetimountains-list">
                <dd class="yetimountains-listelement" v-for="mountain of mountainsForMassif" :key="mountain.title">
                  <a
                    :href="
                      'http://www.meteofrance.com/integration/sim-portail/generated/integration/img/produits/pdf/bulletins_bra/' +
                      mountain.id_mf +
                      '.pdf'
                    "
                    target="_blank"
                    v-if="mountain.id_mf"
                  >
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
  </div>
</template>

<script>
import axios from 'axios';

import ol from '@/js/libs/ol';

const YETI_URL_MOUNTAINS = '/mountains_WGS84.json';

export default {
  props: {
    bra: {
      type: Object,
      default: null,
    },
    map: {
      type: Object,
      default: null,
    },
  },
  data() {
    return {
      mountains: {},
      visibleMountains: {},
      promiseMountains: null,
      showMountainsList: false,
    };
  },
  computed: {
    countVisibleMountains() {
      return Object.values(this.visibleMountains).reduce((a, b) => a + b.length, 0);
    },
  },
  watch: {
    map: 'setMoutainsList',
    'bra.isDifferent': 'checkBraIsDifferent',
  },
  methods: {
    onChange(event, prop) {
      let value = null;
      if (prop === 'isDifferent') {
        value = event;
      } else {
        value = event.target.value;
      }
      this.$emit('update:bra', Object.assign(this.bra, { [prop]: value }));
    },

    checkBraIsDifferent() {
      if (!this.bra.isDifferent) {
        this.bra.low = null;
        this.bra.altiThreshold = null;
      }
    },

    setMoutainsList() {
      // mountains
      this.map.map.on('moveend', this.onMapMoveEnd);
      axios.get(YETI_URL_MOUNTAINS).then(this.onMountainsResult).catch(this.onMountainsError);
    },

    onMountainsResult(data) {
      const features = data.data;
      this.mountains = new ol.format.GeoJSON().readFeatures(features).map((mountain) => {
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

    setVisibleMountains() {
      const mapExtent = this.map.getExtent('EPSG:4326');
      // clone this.mountains first, with no reference
      this.visibleMountains = Object.assign({}, this.mountains);
      // then filter if polygon isn’t in view
      for (const massif in this.visibleMountains) {
        this.visibleMountains[massif] = this.visibleMountains[massif].filter((mountain) => {
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
      // first, order mountains by massifs
      const sortedMountains = {};
      for (let i = 0; i < this.mountains.length; i++) {
        if (!sortedMountains[this.mountains[i].mountain]) {
          sortedMountains[this.mountains[i].mountain] = [];
        }
        sortedMountains[this.mountains[i].mountain].push(this.mountains[i]);
      }
      this.mountains = sortedMountains;

      // then sort mountains inside each massif
      for (const i in this.mountains) {
        this.mountains[i].sort((a, b) => {
          if (a.title < b.title) return -1;
          if (b.title > a.title) return 1;
          return 0;
        });
      }
    },

    onMapMoveEnd(event) {
      this.mapZoom = Math.floor(event.map.getView().getZoom() * 10) / 10;
      this.setVisibleMountains();
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/sass/variables.scss';

.inputs-bra {
  margin-left: 2rem;
  position: relative;

  .input-bra-high {
    position: absolute;
    left: 39px;
    top: 62px;
  }

  .input-bra-threshold {
    position: absolute;
    left: 115px;
    top: 60px;
    width: 85px;
  }

  .input-bra-low {
    position: absolute;
    left: 39px;
    top: 78px;
  }
}

.inputs-bra-different {
  .input-bra-high {
    top: 45px;
  }
}

.yetimountains {
  border: 1px solid #dbdbdb;
  border-radius: 4px;

  &:hover {
    border-color: #b5b5b5;
  }
}

.yetimountains-title {
  cursor: pointer;
  padding: 0.25rem 0.75rem;
}

.yetimountains-count {
  display: inline-block;
  width: 1.1rem;
  height: 1.1rem;
  vertical-align: 0.1rem;
  margin-left: 1rem;
  background: $grey;
  color: $white;
  border-radius: 50%;
  font-size: 0.72em;
  text-align: center;
}

.yetimountains-arrow {
  color: $primary;
  margin-top: 0.25rem;
}

.yetimountains-list {
  columns: 3 170px;
  padding: 0.75rem 2rem;
}

.yetimountains-listtitle {
  font-weight: bold;
  padding: 0 0.75rem;
}

.yetimountains-listelement + .yetimountains-listtitle {
  margin-top: 0.5rem;
}
</style>
