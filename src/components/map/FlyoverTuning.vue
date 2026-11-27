<template>
  <details class="flyover-tuning" open @keydown.stop>
    <summary>Flyover tuning (temporary)</summary>
    <p class="flyover-tuning-info">
      {{ (length / 1000).toFixed(1) }} km · {{ duration.toFixed(0) }} s at 1× · camera {{ cameraDistance.toFixed(0) }} m
      away
    </p>
    <!-- the frame interval against the time of the flyover in it: the rest is the drawing of MapLibre (GPU, tiles) -->
    <p v-if="stats" class="flyover-tuning-info">{{ stats }}</p>
    <label class="flyover-tuning-check" title="showAhead">
      <input
        type="checkbox"
        :checked="settings.showAhead"
        @change="$emit('tune', 'showAhead', ($event.target as HTMLInputElement).checked)"
      />
      <span>Show the part not played yet (faint)</span>
    </label>
    <template v-for="group of GROUPS" :key="group.title">
      <h4>{{ group.title }}</h4>
      <label v-for="field of group.fields" :key="field.path" :title="field.path">
        <span>{{ field.label }}</span>
        <input
          type="range"
          :min="field.min"
          :max="field.max"
          :step="field.step"
          :value="valueOf(field.path)"
          @input="$emit('tune', field.path, Number(($event.target as HTMLInputElement).value))"
        />
        <output>{{ valueOf(field.path) }}</output>
      </label>
    </template>
    <div class="flyover-tuning-actions">
      <button type="button" @click="copy">{{ copied ? 'Copied' : 'Copy as FLYOVER' }}</button>
      <button type="button" @click="$emit('tune', null)">Reset</button>
    </div>
  </details>
</template>

<script setup lang="ts">
// for now, on a desktop screen (MapFlyover.vue), to remove once settled: the values of FLYOVER (map-3d-flyover.ts)
// changed live while the flyover plays, kept in the local storage, and copied back as code to paste into FLYOVER
import { computed, ref } from 'vue';

import type { FlyoverSettings } from './map-3d-flyover';

const props = defineProps<{ settings: FlyoverSettings; length: number; duration: number; stats?: string }>();
defineEmits<{ tune: [path: string | null, value?: number | boolean] }>();

type Field = { path: string; label: string; min: number; max: number; step: number };
const GROUPS: { title: string; fields: Field[] }[] = [
  {
    title: 'Duration at 1× (s)',
    fields: [
      { path: 'duration.base', label: 'at 10 km', min: 10, max: 240, step: 1 },
      { path: 'duration.perDoubling', label: 'per doubling', min: 0, max: 90, step: 1 },
      { path: 'duration.min', label: 'min', min: 5, max: 180, step: 1 },
      { path: 'duration.maxSpeed', label: 'speed at most (camera distances/s)', min: 0.05, max: 1, step: 0.01 },
      { path: 'ramp', label: 'ramp (share)', min: 0, max: 0.3, step: 0.01 },
    ],
  },
  {
    title: 'Camera',
    fields: [
      { path: 'distance.ratio', label: 'distance / length', min: 0, max: 0.3, step: 0.005 },
      { path: 'distance.min', label: 'distance min (m)', min: 100, max: 5000, step: 50 },
      { path: 'distance.max', label: 'distance max (m)', min: 300, max: 15000, step: 100 },
      { path: 'elevationAngle', label: 'angle above horizon (°)', min: 5, max: 85, step: 1 },
      { path: 'clearance', label: 'above terrain (m)', min: 0, max: 1000, step: 10 },
      { path: 'lead', label: 'look ahead (share)', min: 0, max: 1, step: 0.05 },
      { path: 'steepGain', label: 'farther on slopes (×slope)', min: 0, max: 5, step: 0.1 },
      { path: 'steepMax', label: 'farther at most (×)', min: 1, max: 4, step: 0.1 },
      { path: 'steepSpan', label: 'slope measured over (m)', min: 50, max: 1000, step: 50 },
      { path: 'steepSigma', label: 'farther smoothed (×distance)', min: 0, max: 2, step: 0.05 },
    ],
  },
  {
    title: 'Smoothing',
    fields: [
      { path: 'bearingTau', label: 'turn time (s)', min: 0.1, max: 6, step: 0.1 },
      { path: 'bearingRate', label: 'turn max (°/s)', min: 5, max: 180, step: 5 },
      { path: 'climbTau', label: 'climb time (s)', min: 0.05, max: 3, step: 0.05 },
      { path: 'descentTau', label: 'descent time (s)', min: 0.1, max: 6, step: 0.1 },
      { path: 'headingSigma.ratio', label: 'heading / length', min: 0, max: 0.1, step: 0.005 },
      { path: 'headingSigma.min', label: 'heading min (m)', min: 0, max: 2000, step: 10 },
      { path: 'headingSigma.max', label: 'heading max (m)', min: 50, max: 5000, step: 50 },
      { path: 'positionSigma.ratio', label: 'position / length', min: 0, max: 0.05, step: 0.001 },
      { path: 'positionSigma.min', label: 'position min (m)', min: 0, max: 1000, step: 10 },
      { path: 'positionSigma.max', label: 'position max (m)', min: 10, max: 2000, step: 10 },
      { path: 'altitudeSigma.ratio', label: 'height / length', min: 0, max: 0.1, step: 0.001 },
      { path: 'altitudeSigma.min', label: 'height min (m)', min: 0, max: 2000, step: 10 },
      { path: 'altitudeSigma.max', label: 'height max (m)', min: 10, max: 3000, step: 10 },
    ],
  },
  {
    title: 'Transitions (ms)',
    fields: [
      { path: 'intro', label: 'intro', min: 0, max: 5000, step: 100 },
      { path: 'recenter', label: 'recenter', min: 0, max: 3000, step: 100 },
      { path: 'outro', label: 'outro', min: 0, max: 6000, step: 100 },
      { path: 'outroPitch', label: 'outro pitch (°)', min: 0, max: 80, step: 1 },
    ],
  },
];

function valueOf(path: string): number {
  return path
    .split('.')
    .reduce<unknown>((value, key) => (value as Record<string, unknown>)[key], props.settings) as number;
}

const cameraDistance = computed(() => {
  const { ratio, min, max } = props.settings.distance;
  return Math.min(Math.max(ratio * props.length, min), max);
});

const copied = ref(false);
async function copy() {
  const code = `export const FLYOVER = ${JSON.stringify(props.settings, null, 2).replace(/"(\w+)":/g, '$1:')};`;
  await navigator.clipboard.writeText(code);
  copied.value = true;
  setTimeout(() => (copied.value = false), 1500);
}
</script>

<style scoped>
.flyover-tuning {
  position: absolute;
  top: 0.5em;
  left: 0.5em;
  width: 340px;
  max-height: calc(100% - 4.5em);
  overflow: auto;
  padding: 0.4em 0.6em;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.92);
  font-size: 12px;

  summary {
    font-weight: bold;
    cursor: pointer;
  }

  h4 {
    margin: 0.6em 0 0.2em;
    font-weight: bold;
  }

  label {
    display: grid;
    grid-template-columns: 120px 1fr 48px;
    align-items: center;
    gap: 0.3em;
  }

  output {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
}

.flyover-tuning .flyover-tuning-check {
  display: flex;
  gap: 0.4em;
}

.flyover-tuning-info {
  margin: 0.3em 0;
  color: #555;
}

.flyover-tuning-actions {
  display: flex;
  gap: 0.5em;
  margin-top: 0.6em;
}
</style>
