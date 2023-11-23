<template>
  <div>
    <div class="legend">
      <div>
        <div class="legend-button is-pulled-right ol-control">
          <button type="button" @click="showLegend = !showLegend">
            <span v-translate>Legend</span>
            <fa-layers class="icon" v-if="atLeastOneLegend">
              <fa-icon icon="circle" transform="shrink-2 up-18 left-2" />
              <fa-icon icon="check-circle" inverse transform="shrink-2 up-18 left-2" class="icon-notification" />
            </fa-layers>
          </button>
        </div>
      </div>
      <div class="legend-content" v-show="showLegend === true">
        <div v-if="atLeastOneLegend">
          <yeti-layer-legend v-if="yetiLegend" class="legend-item"></yeti-layer-legend>
          <winter-route-layer-legend v-if="winterRouteLegend" class="legend-item"></winter-route-layer-legend>
        </div>
        <p class="is-italic" v-else v-translate>No specific legend to show</p>
      </div>
    </div>
  </div>
</template>

<script>
import Yetix from '@/components/yeti/Yetix';
import WinterRouteLayerLegend from '@/components/yeti/map-layers/WinterRouteLayerLegend';
import YetiLayerLegend from '@/components/yeti/map-layers/YetiLayerLegend';

export default {
  components: {
    WinterRouteLayerLegend,
    YetiLayerLegend,
  },
  data() {
    return {
      showLegend: undefined,
    };
  },
  computed: {
    yetiLegend() {
      return Yetix.yetiLegend;
    },
    winterRouteLegend() {
      return Yetix.winterRouteLegend;
    },
    atLeastOneLegend() {
      return this.yetiLegend || this.winterRouteLegend;
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/sass/variables';

.legend {
  position: absolute;
  z-index: 6;
  top: 1.25rem;
  right: 1.25rem;
  max-width: 400px;

  .legend-button {
    position: static;

    button {
      width: auto;
      padding: 0 0.5em;
    }
  }

  .legend-content {
    margin-top: 0.5rem;
    margin-left: 1.25rem;
    border-radius: 2px;
    border: 1px solid lightgray;
    padding: 0.5rem;
    background: white;
    clear: both;
  }

  .legend-item + .legend-item {
    margin-top: 2rem;
    padding-top: 1em;
    border-top: solid 1px $grey-lighter;
  }
}

.icon {
  position: absolute;
  top: 7px;
  right: -10px;
}
.icon-notification {
  color: $primary;
}

@media screen and (max-width: $tablet) {
  .legend {
    top: 0.5rem;

    .legend-content {
      margin-left: 0.5rem;
    }
  }
}
</style>
