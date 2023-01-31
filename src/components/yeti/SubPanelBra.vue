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

    <dropdown-content>
      <span v-translate>Avalanche bulletins</span>
      <counter v-if="showVisibleMountains">{{ countVisibleMountains }}</counter>
      <fa-icon
        icon="check-circle"
        v-if="showAvalancheBulletins"
        class="has-text-primary"
        :title="$gettext('Visible on map')"
      />
      <template #content>
        <div v-if="showVisibleMountains">
          <div class="mb-2">
            <input-checkbox @input="onShowAvalancheBulletins" :value="showAvalancheBulletins">
              <span v-translate>Visible on map</span>
            </input-checkbox>
          </div>
          <dl>
            <div v-for="(mountainsForMassif, massif) of visibleMountains" :key="massif">
              <dt>
                {{ massif }}
              </dt>
              <div class="yetimountains-list px-4 py-3">
                <dd v-for="mountain of mountainsForMassif" :key="mountain.name">
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
          <info class="column" v-translate>Massifs could not be loaded</info>
        </div>
      </template>
    </dropdown-content>
  </div>
</template>

<script>
import Counter from '@/components/yeti/Counter.vue';
import DropdownContent from '@/components/yeti/DropdownContent.vue';
import Info from '@/components/yeti/Info.vue';
import SubPanelTitle from '@/components/yeti/SubPanelTitle.vue';
import Yetix from '@/components/yeti/Yetix';

export default {
  components: { Counter, DropdownContent, Info, SubPanelTitle },
  data() {
    return {
      showMountainsList: false,
    };
  },
  computed: {
    bra() {
      return Yetix.bra;
    },
    visibleMountains() {
      return Yetix.mountains.visible;
    },
    showAvalancheBulletins() {
      return Yetix.showAvalancheBulletins;
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
      Yetix.setBra(prop, value);
    },
    checkBraIsDifferent() {
      if (!this.bra.isDifferent) {
        Yetix.setBra('low', null);
        Yetix.setBra('altiThreshold', null);
      }
    },
    onShowAvalancheBulletins(value) {
      Yetix.setShowAvalancheBulletins(value);
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/sass/variables';

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

.yetimountains-list {
  columns: 3 170px;
}
</style>
