<template>
  <div class="yeti-subpanel">
    <sub-panel-title><span v-translate>Danger level</span></sub-panel-title>
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
            <select
              id="selectBra"
              @change="onChange($event, 'high')"
              :value="bra.high"
              :aria-label="$gettext('High danger level from the avalanche bulletin')"
            >
              <option :value="null" selected />
              <option :value="1">1</option>
              <option :value="2">2</option>
              <option :value="3">3</option>
              <option :value="4">4</option>
            </select>
          </div>
          <div v-show="bra.isDifferent" class="input-bra-threshold control">
            <label for="inputThreshold" v-translate>Altitude</label>
            <input
              id="inputThreshold"
              class="input is-small"
              type="number"
              min="0"
              max="4800"
              step="100"
              maxlength="4"
              @change="onChange($event, 'altiThreshold')"
              :value="bra.altiThreshold"
            />
          </div>

          <div v-show="bra.isDifferent" class="input-bra-low select is-small">
            <select
              @change="onChange($event, 'low')"
              :value="bra.low"
              aria-label="$gettext('Low danger level from the avalanche bulletin')"
            >
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
            <span v-translate>Different high/low danger?</span>
          </input-checkbox>
        </div>
      </div>
    </div>

    <div class="yetimountains">
      <div>
        <p class="yetimountains-title" @click="showMountainsList = !showMountainsList">
          <span v-translate>Avalanche bulletins</span>
          <counter v-if="showVisibleMountains">{{ countVisibleMountains }}</counter>
          <fa-icon
            class="yetimountains-arrow is-size-6 is-pulled-right has-cursor-pointer no-print"
            icon="angle-down"
            :rotation="showMountainsList ? 180 : undefined"
          />
        </p>
      </div>
      <div v-if="showMountainsList">
        <div v-if="showVisibleMountains">
          <div class="pl-3 mt-2 mb-2">
            <input-checkbox @input="onShowMountains" :value="showMountains">
              <span v-translate>Show on map</span>
            </input-checkbox>
          </div>
          <dl>
            <div v-for="(mountainsForMassif, massif) of visibleMountains" :key="massif">
              <dt class="yetimountains-listtitle">
                {{ massif }}
              </dt>
              <div class="yetimountains-list">
                <dd class="yetimountains-listelement" v-for="mountain of mountainsForMassif" :key="mountain.name">
                  <a :href="mountain.urls[0].url" target="_blank">
                    <fa-icon icon="external-link-alt" />
                    {{ mountain.name }}
                  </a>
                </dd>
              </div>
            </div>
          </dl>
        </div>
        <div v-else>
          <p class="column yetiform-info" v-translate>Massifs could not be loaded</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Counter from '@/components/yeti/Counter.vue';
import SubPanelTitle from '@/components/yeti/SubPanelTitle.vue';
import { state, mutations } from '@/components/yeti/yetix';

export default {
  components: { Counter, SubPanelTitle },
  data() {
    return {
      showMountainsList: false,
    };
  },
  computed: {
    bra() {
      return state.bra;
    },
    visibleMountains() {
      return state.mountains.visible;
    },
    showMountains() {
      return state.showMountains;
    },
    showVisibleMountains() {
      return this.countVisibleMountains >= 0;
    },
    countVisibleMountains() {
      // if visibleMountains are set
      if (this.visibleMountains) {
        return Object.values(this.visibleMountains).reduce((a, b) => a + b.length, 0);
      }
      // else, return -1 (because 0 is not an error)
      return -1;
    },
  },
  watch: {
    'bra.isDifferent': 'checkBraIsDifferent',
  },
  methods: {
    onChange(event, prop) {
      const value = prop === 'isDifferent' ? event : event.target.value;
      mutations.setBra(prop, value);
    },
    checkBraIsDifferent() {
      if (!this.bra.isDifferent) {
        mutations.setBra('low', null);
        mutations.setBra('altiThreshold', null);
      }
    },
    onShowMountains(value) {
      mutations.setShowMountains(value);
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
    top: 40px;
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

  &-title {
    cursor: pointer;
    padding: 0.25rem 0.75rem;
  }

  &-arrow {
    color: $primary;
    margin-top: 0.25rem;
  }

  &-list {
    columns: 3 170px;
    padding: 0.75rem 2rem;
  }

  &-listtitle {
    font-weight: bold;
    padding: 0 0.75rem;
  }
}

.yetimountains-listelement + .yetimountains-listtitle {
  margin-top: 0.5rem;
}
</style>
