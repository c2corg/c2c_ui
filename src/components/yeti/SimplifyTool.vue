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

<script setup lang="ts">
import type Feature from 'ol/Feature';
import type LineString from 'ol/geom/LineString';
import { computed, onUnmounted, ref, watch } from 'vue';

import DropdownContent from '@/components/yeti/DropdownContent.vue';
import Info from '@/components/yeti/Info.vue';
import Yetix from '@/components/yeti/yetix';
import yetixEvents from '@/components/yeti/yetix-events';
import { useGlobalProperties } from '@/js/composables/global-properties';

const { $gettext } = useGlobalProperties();

const tolerances = [0, 25, 50, 100, 200];
const tolerancesText = [$gettext('No'), '25m', '50m', '100m', '200m'];
const toleranceDistance = ref(0);

const featuresLength = computed(() => Yetix.featuresLength);
const featuresSimplifiedLength = computed(() =>
  (Yetix.features as Feature<LineString>[])
    .map((feature) => feature.getGeometry()!.getCoordinates().length)
    .reduce((acc, value) => acc + value)
);
const validToleranceDistance = computed(() => toleranceDistance.value !== 0);

watch(toleranceDistance, () => {
  Yetix.setValidSimplifyTolerance(validToleranceDistance.value);
});

// set validSimplifyTolerance to false
// go back to normal case for simplify tool
// and retrieve default value for edit mode
onUnmounted(() => {
  Yetix.setValidSimplifyTolerance(false);
});

function onPreviewSimplify() {
  yetixEvents.emit('previewSimplify', toleranceDistance.value);
}

function initialize() {
  toleranceDistance.value = 0;
  onPreviewSimplify();
}

function onSimplify() {
  yetixEvents.emit('simplify');
  // go back to init
  initialize();
}

// the course panel resets it when the features are removed
defineExpose({ initialize });
</script>
