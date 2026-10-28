<template>
  <button
    class="button edit-mode-button ol-control-edit-mode"
    :class="{ 'is-dark': editMode, 'is-small': isSmall }"
    :title="$gettext('Enable drawing and editing features on map')"
    :aria-label="iconOnly ? $gettext('Enable drawing and editing features on map') : undefined"
  >
    <input-checkbox @update:model-value="onEditMode" :model-value="editMode" :disabled="validSimplifyTolerance">
      <span v-if="!iconOnly" v-translate> Edit mode </span>
      <fa-icon icon="pen" class="ml-1" />
    </input-checkbox>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import Yetix from '@/components/yeti/yetix';

defineProps({
  isSmall: {
    type: Boolean,
    default: false,
  },
  iconOnly: {
    type: Boolean,
    default: false,
  },
});

const editMode = computed(() => Yetix.editMode);

const validSimplifyTolerance = computed(() => Yetix.validSimplifyTolerance);

function onEditMode() {
  Yetix.setEditMode(!editMode.value);
}
</script>

<style scoped lang="scss">
.edit-mode-button {
  padding-left: 0.25em;
  padding-right: 0.25em;
  .input-checkbox {
    padding: 0;
  }
  .is-checkradio[type='checkbox'] + label {
    margin-right: 0;
    vertical-align: baseline;

    &:before {
      top: 1px;
    }
  }
}
</style>

<style lang="scss">
.edit-mode-button {
  .input-checkbox {
    padding: 0;
  }

  .is-checkradio[type='checkbox'] + label {
    margin-right: 0;
    vertical-align: baseline;

    &:before {
      top: 1px;
    }
  }
}
/* when used inside map */
.map-container {
  .edit-mode-button {
    height: 2em;
    border: none;
    box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.2);

    .is-checkradio[type='checkbox'] + label {
      font-size: 0.93em;
      margin-right: 0;
    }
  }
}
</style>
