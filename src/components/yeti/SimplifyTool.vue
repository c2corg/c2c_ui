<template>
  <dropdown-content class="mb-5">
    <span v-translate>Simplify</span>
    <fa-icon
      icon="exclamation-circle"
      v-if="validToleranceDistance"
      class="has-text-danger ml-1"
      :title="$gettext('Not simplified yet')"
    />
    <template #content>
      <p v-translate>Select tolerance (preview result on map)</p>
      <div class="is-flex is-justify-content-center is-flex-wrap-wrap mt-3 mb-4">
        <div v-for="(tolerance, i) of tolerances" :key="tolerance" class="mb-2 is-flex-grow-1">
          <input
            :id="'tolerance' + i"
            class="is-checkradio is-primary"
            type="radio"
            name="tolerances"
            :value="tolerance"
            v-model="toleranceDistance"
            @change="onPreviewSimplify"
          />
          <label :for="'tolerance' + i" class="mr-0">{{ tolerancesText[i] }}</label>
        </div>
      </div>
      <div class="is-flex is-justify-content-flex-end is-align-items-center">
        <div>
          <button class="button" :disabled="!validToleranceDistance" @click="initialize" v-translate>Cancel</button>
          <button class="button is-primary" :disabled="!validToleranceDistance" @click="onSimplify" v-translate>
            Simplify
          </button>
        </div>
      </div>
      <info>
        {{ featuresLength }} <span v-translate>points</span>
        <strong v-if="validToleranceDistance">
          (<span v-translate>after:</span> {{ featuresSimplifiedLength }} <span v-translate>points</span>)
        </strong>
      </info>
      <info type="warning" v-if="validToleranceDistance">
        <strong v-translate>Be careful,</strong>
        <span v-translate>
          this is a preview. Geometry is not simplified yet. Map interactions and export are disabled.
        </span>
      </info>
      <info type="help" class="mt-5">
        <span v-translate>Create a simplified version of the geometry by reducing the amount of points</span>
      </info>
    </template>
  </dropdown-content>
</template>

<script>
import DropdownContent from '@/components/yeti/DropdownContent.vue';
import Info from '@/components/yeti/Info.vue';
import Yetix from '@/components/yeti/Yetix';

export default {
  components: { DropdownContent, Info },
  data() {
    return {
      tolerances: [0, 25, 50, 100, 200],
      tolerancesText: [this.$gettext('No'), '25m', '50m', '100m', '200m'],
      toleranceDistance: 0,
    };
  },
  computed: {
    features() {
      return Yetix.features;
    },
    featuresLength() {
      return Yetix.featuresLength;
    },
    featuresSimplifiedLength() {
      return this.features
        .map((feature) => {
          return feature.getGeometry().getCoordinates().length;
        })
        .reduce((acc, value) => acc + value);
    },
    validToleranceDistance() {
      return this.toleranceDistance !== 0;
    },
  },
  watch: {
    toleranceDistance() {
      if (this.validToleranceDistance) {
        Yetix.setValidSimplifyTolerance(true);
      } else {
        Yetix.setValidSimplifyTolerance(false);
      }
    },
  },
  destroyed() {
    // set validSimplifyTolerance to false
    // go back to normal case for simplify tool
    // and retrieve default value for edit mode
    Yetix.setValidSimplifyTolerance(false);
  },
  methods: {
    onPreviewSimplify() {
      Yetix.$emit('previewSimplify', this.toleranceDistance);
    },
    onSimplify() {
      Yetix.$emit('simplify');
      // go back to init
      this.initialize();
    },
    initialize() {
      this.toleranceDistance = 0;
      this.onPreviewSimplify();
    },
  },
};
</script>
