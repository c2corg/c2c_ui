<template>
  <modal-card ref="modalWindow">
    <template #title>
      <span>
        <span v-translate>This tool estimates the technical difficulty of a ski route (ski rating).</span>
      </span>
    </template>

    <div class="field">
      <label class="label" v-translate>Skiability</label>
      <div class="control">
        <input
          id="c2c-skiability-0"
          name="c2c-skiability"
          class="is-checkradio is-info"
          type="radio"
          v-model="skiability"
          :value="0"
        />
        <label v-translate for="c2c-skiability-0">Wide and constant</label>
      </div>
      <div class="control">
        <input
          type="radio"
          id="c2c-skiability-1"
          name="c2c-skiability"
          class="is-checkradio is-info"
          v-model="skiability"
          :value="0.1"
        />
        <label v-translate for="c2c-skiability-1">1 or 2 complications (steeper or narrow section...)</label>
      </div>

      <div class="control">
        <input
          type="radio"
          id="c2c-skiability-2"
          name="c2c-skiability"
          class="is-checkradio is-info"
          v-model="skiability"
          :value="0.2"
        />
        <label v-translate for="c2c-skiability-2">Very complex (steps, narrow sections, ridges...)</label>
      </div>
    </div>

    <div class="field">
      <label class="label" v-translate>Average slope (degrees)</label>
      <div class="control">
        <input v-model="slope" class="input" :placeholder="$gettext('Average slope in degree')" type="number" />
      </div>
      <p class="help is-danger" v-if="errorSlope" v-translate>The slope must be between 0 and 80 deg</p>
    </div>

    <div class="field">
      <label class="label" v-translate>height_diff</label>
      <div class="control">
        <input v-model="elevation" class="input" type="number" min="50" max="3000" />
      </div>
      <p class="help is-danger" v-if="errorElevation" v-translate>The slope must be between 50 and 3000m high</p>
    </div>

    <h1 class="title is-1 has-text-centered" v-if="rating">
      <span v-translate>Suggested rating</span>
      <br />
      <span class="has-text-success">
        {{ rating }}
      </span>
    </h1>

    <template #footer>
      <footer>
        <button class="button is-success" type="button" @click="setResult" :disabled="!rating" v-translate>Ok</button>
        <button class="button is-default" type="button" @click="modalWindow!.hide()" v-translate>Cancel</button>
      </footer>
    </template>
  </modal-card>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef } from 'vue';

const emit = defineEmits(['update:modelValue']);

const modalWindow = useTemplateRef<{ show(): void; hide(): void }>('modalWindow');

const skiability = ref(0);
// numbers once typed, '' when cleared
const slope = ref<number | string | null>(null);
const elevation = ref<number | string | null>(50);

// as the former arithmetic on them: null and '' count as 0
const slopeValue = computed(() => Number(slope.value));
const elevationValue = computed(() => Number(elevation.value));

const errorSlope = computed(() => Number.isNaN(slopeValue.value) || slopeValue.value < 0 || slopeValue.value > 80.0);

const errorElevation = computed(
  () =>
    (Number.isNaN(elevationValue.value) || elevationValue.value < 50.0 || elevationValue.value > 3000.0) &&
    elevation.value !== null
);

const rating = computed(() => {
  if (errorSlope.value || errorElevation.value) {
    return null;
  }

  let inter = Math.tan((Math.PI * slopeValue.value) / 180) + 0.1 * Math.log(elevationValue.value);
  inter += skiability.value * (inter - 1);

  const diff = (1 + skiability.value) * elevationValue.value;

  if (slopeValue.value <= 17 && diff < 400) {
    return '1.1';
  }

  if (slopeValue.value <= 23 && diff < 650) {
    return '1.2';
  }

  if (slopeValue.value < 30 && diff < 800) {
    return '1.3';
  }

  if ((slopeValue.value < 35 && diff < 800) || (slopeValue.value < 23 && diff > 800)) {
    return '2.1';
  }

  if (slopeValue.value < 35 && diff <= 950) {
    return '2.2';
  }

  if (slopeValue.value < 35 && diff > 950) {
    return '2.3';
  }

  if (slopeValue.value >= 35 && slopeValue.value <= 40 && diff < 650) {
    return '3.1';
  }

  if (slopeValue.value >= 35 && slopeValue.value <= 40 && diff <= 900) {
    return '3.2';
  }

  if (slopeValue.value >= 35 && slopeValue.value <= 40 && diff > 900) {
    return '3.3';
  }

  if (inter < 0.98) {
    return '1.1';
  }

  if (inter >= 0.98 && inter < 1.02) {
    return '1.2';
  }

  if (inter >= 1.03 && inter < 1.09) {
    return '+1.3';
  }

  if (inter >= 1.09 && inter < 1.18) {
    return '+2.1';
  }

  if (inter >= 1.18 && inter < 1.24) {
    return '2.2';
  }

  if (inter >= 1.24 && inter < 1.3) {
    return '2.3';
  }

  if (inter >= 1.3 && inter < 1.34) {
    return '3.1';
  }

  if (inter >= 1.34 && inter < 1.39) {
    return '3.2';
  }

  if (inter >= 1.39 && inter < 1.42) {
    return '3.3';
  }

  if (inter >= 1.42 && inter < 1.46) {
    return '4.1';
  }

  if (inter >= 1.46 && inter < 1.52) {
    return '4.2';
  }

  if (inter >= 1.52 && inter < 1.575) {
    return '4.3';
  }

  if (inter >= 1.575 && inter < 1.67) {
    return '5.1';
  }

  if (inter >= 1.67 && inter < 1.745) {
    return '5.2';
  }

  if (inter >= 1.745 && inter < 1.81) {
    return '5.3';
  }

  if (inter >= 1.81 && inter < 1.95) {
    return '5.4';
  }

  if (inter >= 1.95 && inter < 2.09) {
    return '5.5';
  }

  if (inter >= 2.09 && inter < 2.25) {
    return '5.6';
  }

  if (inter >= 2.25 && inter < 2.4) {
    return '5.7';
  }

  return '5.8';
});

function show() {
  modalWindow.value!.show();
}

function setResult() {
  emit('update:modelValue', rating.value);
  modalWindow.value!.hide();
}

// the outing edition view opens it through a template ref
defineExpose({ show });
</script>
