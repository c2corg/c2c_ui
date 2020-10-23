<template>
  <div class="yeti-subpanel panelBRA">
    <sub-panel-title>Info <abbr title="Bulletin d’estimation du risque d’avalanche">BRA</abbr></sub-panel-title>
    <div class="columns is-mobile">
      <div class="column">
        <div class="inputs-bra" :class="{ 'inputs-bra-different': bra.isDifferent }">
          <svg viewBox="0 0 100 100" width="120" height="120">
            <polygon
              style="fill: none; stroke: #000; stroke-miterlimit: 10"
              points="2.2,89.5 97.5,89.5 62.7,11.9 48,32.9 31.8,25.5 "
            />
            <line
              v-show="bra.isDifferent"
              style="fill: none; stroke: #000; stroke-miterlimit: 10"
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
          <counter v-if="mountainsLength">{{ countVisibleMountains }}</counter>
          <fa-icon
            class="yetimountains-arrow is-size-6 is-pulled-right has-cursor-pointer no-print"
            icon="angle-down"
            :rotation="showMountainsList ? 180 : undefined"
          />
        </p>
      </div>
      <div v-if="showMountainsList">
        <div v-if="mountainsLength">
          <p class="column yetiform-info">Affichez les bulletins en PDF sur le site de Météo France</p>
          <dl>
            <div v-for="(mountainsForMassif, massif) of mountains" :key="massif">
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
import Counter from '@/components/yeti/Counter.vue';
import SubPanelTitle from '@/components/yeti/SubPanelTitle.vue';

export default {
  components: { Counter, SubPanelTitle },
  props: {
    bra: {
      type: Object,
      default: null,
    },
    mountains: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      showMountainsList: false,
    };
  },
  computed: {
    mountainsLength() {
      return this.countVisibleMountains >= 0;
    },
    countVisibleMountains() {
      return Object.values(this.mountains).reduce((a, b) => a + b.length, 0);
    },
  },
  watch: {
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
