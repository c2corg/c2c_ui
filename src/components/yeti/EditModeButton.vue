<template>
  <div class="ol-control ol-control-edit-mode" :class="{ 'is-primary': editMode }">
    <div class="ol-control-edit-mode-inner">
      <input-checkbox @input="onEditMode" :value="editMode" :disabled="validSimplifyTolerance">
        <span v-translate :title="$gettext('Enable drawing and editing features on map')">Edit mode</span>
        <fa-icon icon="pen" class="ml-1" />
      </input-checkbox>
    </div>
  </div>
</template>

<script>
import Yetix from '@/components/yeti/Yetix';

export default {
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
@import '@/assets/sass/variables';

.ol-control-edit-mode {
  padding: 0 !important;

  &.is-primary {
    box-shadow: none;
  }

  .ol-control-edit-mode-inner {
    padding: 0.3rem 0.25rem 0.2rem;
    border-radius: 4px;
    background: $white;
    white-space: nowrap;
  }

  &.is-primary .ol-control-edit-mode-inner {
    background: $grey-dark;
    color: $white;
  }
}
</style>

<style lang="scss">
.yeti-app {
  .ol-control-edit-mode {
    .is-checkradio[type='checkbox'] + label {
      font-size: 0.93em;
      margin-right: 0;
    }
  }
}
</style>
