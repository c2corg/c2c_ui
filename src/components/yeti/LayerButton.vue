<template>
  <div class="layer-button" v-on="disabled?.condition ? { click: warnIfDisabled } : {}">
    <input
      :id="'layer-checkbox' + uid"
      class="is-checkradio is-primary"
      :type="type"
      :name="name"
      v-model="_value"
      :value="model"
      :disabled="disabled?.condition"
      @change="$emit('change')"
    />
    <label :for="'layer-checkbox' + uid" class="layer-label">
      <div
        class="layer-image"
        :style="{
          'background-image': backgroundImage,
        }"
      >
        <span
          class="layer-country"
          :class="'layer-country-' + country"
          v-if="country"
          :style="{ 'background-image': 'url(' + assetUrl('flags', country + '.svg') + ')' }"
        ></span>
      </div>
      <div class="layer-text" :class="{ 'has-text-primary': model ? model.checked : _value }">
        <slot />
      </div>
    </label>
    <toast ref="disabledToast">
      <template #title>{{ disabled?.title }}</template>
      {{ disabled?.message }}
    </toast>
  </div>
</template>

<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';

import Toast from '@/components/yeti/Toast.vue';
import { assetUrl } from '@/js/asset-urls';
import { useUid } from '@/js/uid';

const props = defineProps({
  type: {
    type: String,
    default: 'checkbox',
  },
  name: {
    type: String,
    default: null,
  },
  modelValue: {
    type: [Boolean, Object],
    default: null,
  },
  model: {
    type: Object,
    default: null,
  },
  disabled: {
    type: Object,
    default: null,
  },
  image: {
    type: String,
    default: null,
  },
  country: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(['change', 'update:modelValue']);

const { uid } = useUid();
const disabledToast = useTemplateRef<{ toast(options?: object): void }>('disabledToast');

const _value = computed({
  get: () => props.modelValue,
  set(value) {
    emit('update:modelValue', value);
  },
});

const backgroundImage = computed(() => {
  try {
    return 'url(' + assetUrl('yeti/layers', props.image) + ')';
  } catch {
    return 'none';
  }
});

function warnIfDisabled() {
  disabledToast.value!.toast();
}
</script>

<style scoped lang="scss">
$width: calc(70 / 14 * 1rem);
$height: calc(50 / 14 * 1rem);

.layer-image {
  position: relative;
  width: $width;
  min-height: $height;
  background: #dbdbdb;
  box-shadow:
    0 0 0 2px white,
    0 0 0 3px #dbdbdb;
  border-radius: 4px;
  margin-bottom: 0.5rem;
  background-position: center;
}
.layer-label {
  display: flex !important;
  flex-direction: column;
  align-items: center;
  padding: 0 !important;
  margin: 0 !important;
}
.layer-text {
  margin: 0 -8px;
}
.layer-country {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 16px;
  height: 12px;
  background-size: cover;
  background-position: center;
}
.layer-country-ch {
  width: 12px;
}
.layer-button {
  text-align: center;

  .is-checkradio[type='checkbox'] + label::before,
  .is-checkradio[type='radio'] + label::before,
  .is-checkradio[type='checkbox'] + label::after,
  .is-checkradio[type='radio'] + label::after {
    z-index: 1;
    left: calc(50% - ($width / 2));
  }
  .is-checkradio[type='checkbox'] + label::before,
  .is-checkradio[type='radio'] + label::before {
    background: #0000;
    border-color: #0000;
  }
  .is-checkradio[type='checkbox'] + label::after,
  .is-checkradio[type='radio'] + label::after {
    left: calc(50% - ($width / 2) + 0.5rem) !important;
  }
  .is-checkradio:hover:not([disabled]) + label .layer-image {
    box-shadow:
      0 0 0 2px $white,
      0 0 0 4px $primary;
  }
  .is-checkradio:focus-visible + label .layer-image {
    box-shadow:
      0 0 0 2px $white,
      0 0 0 4px $primary;
  }
  .is-checkradio:checked:not([disabled]) + label::before {
    box-shadow: 0 0 0 2px $white;
  }
  .is-checkradio:not(:checked):hover:not([disabled]) + label::before {
    border-width: 1px;
    border-color: #dbdbdb !important;
    background: white;
    box-shadow: none;
  }
  .is-checkradio:not(:checked):focus-visible + label::before {
    border-width: 1px;
    border-color: #dbdbdb !important;
    background: white;
    box-shadow: none;
  }
  .is-checkradio:checked:not([disabled]) + label .layer-image {
    box-shadow:
      0 0 0 2px $white,
      0 0 0 4px $primary;
  }
  .is-checkradio:checked:focus-visible + label .layer-image {
    box-shadow:
      0 0 0 2px $white,
      0 0 0 4px $primary,
      0 0 0 6px $secondary !important;
  }
}
.is-small {
  .layer-image {
    width: 1.5rem;
    min-height: 1.5rem;
    margin-bottom: 0;
    background-size: 220%;
  }
  .layer-label {
    flex-direction: row;
    align-items: flex-start;
  }
  .layer-text {
    margin-left: 0.5rem;
    text-align: left;
    white-space: nowrap;
  }
  .is-checkradio[type='checkbox'] + label::before,
  .is-checkradio[type='radio'] + label::before {
    left: 0;
  }
  .is-checkradio:not(:checked):hover:not([disabled]) + label::before {
    opacity: 0;
  }
  .is-checkradio:not(:checked):focus-visible + label::before {
    opacity: 0;
  }
  .is-checkradio[type='checkbox'] + label::after,
  .is-checkradio[type='radio'] + label::after {
    left: 0.5rem !important;
  }
}
</style>
