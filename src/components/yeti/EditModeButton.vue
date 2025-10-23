<template>
  <button class="button edit-mode-button ol-control-edit-mode" :class="{ 'is-dark': editMode, 'is-small': isSmall }">
    <input-checkbox @input="onEditMode" :value="editMode" :disabled="validSimplifyTolerance">
      <span v-if="!iconOnly" v-translate :title="$gettext('Enable drawing and editing features on map')">
        Edit mode
      </span>
      <fa-icon icon="pen" class="ml-1" />
    </input-checkbox>
  </button>
</template>

<script>
import Yetix from '@/components/yeti/Yetix';

export default {
  props: {
    isSmall: {
      type: Boolean,
      default: false,
    },
    iconOnly: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    editMode() {
      return Yetix.editMode;
    },
    validSimplifyTolerance() {
      return Yetix.validSimplifyTolerance;
    },
  },
  methods: {
    onEditMode() {
      Yetix.setEditMode(!this.editMode);
    },
  },
};
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
