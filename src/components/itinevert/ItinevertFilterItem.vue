<template>
  <div v-if="field" class="field">
    <div v-if="field.queryMode === 'valuesRangeSlider'" class="control">
      <query-item-slider-label :field="field" :value="selected" />
      <vue-slider
        v-model="selected"
        :data="field.values"
        :lazy="true"
        :marks="field.values"
        hide-label
        tooltip="focus"
        :tooltip-formatter="field.i18n ? gettext : undefined"
      />
    </div>

    <div v-else-if="field.queryMode === 'numericalRangeSlider'" class="control">
      <query-item-slider-label :field="field" :value="selected" />
      <vue-slider
        v-model="selected"
        :min="field.min"
        :max="field.max"
        :interval="interval"
        :lazy="true"
        tooltip="focus"
      />
    </div>

    <div v-else-if="field.queryMode === 'multiSelect'" class="control">
      <label class="label">{{ $gettext(field.name) | uppercaseFirstLetter }}</label>
      <multiselect
        v-model="selected"
        :options="field.values"
        :custom-label="field.i18n ? gettext : undefined"
        :placeholder="$gettext('Select option')"
        :select-label="$gettext('Press enter to select')"
        :multiple="true"
      />
    </div>

    <div v-else-if="field.queryMode === 'orientations'" class="level">
      <input-orientation v-model="selected" class="level-item" />
    </div>

    <div v-else-if="field.queryMode === 'input'" class="control">
      <label v-if="!hideLabel" class="label">{{ $gettext(field.name) | uppercaseFirstLetter }}</label>
      <input ref="input" :type="field.type" v-model="selected" class="input" :placeholder="$gettext(field.name)" />
    </div>

    <div v-else-if="field.queryMode === 'tristate'" class="control">
      <label class="label">{{ $gettext(field.name) | uppercaseFirstLetter }}</label>
      <multiselect
        v-model="selected"
        :options="['yes', 'no', 'no info']"
        :custom-label="gettext"
        :placeholder="$gettext('Select option')"
        :select-label="$gettext('Press enter to select')"
      />
    </div>

    <div v-else-if="field.queryMode === 'checkbox'" class="control">
      <input-checkbox v-model="selected">
        {{ $gettext(field.name) }}
      </input-checkbox>
    </div>

    <div v-else-if="field.queryMode === 'activities'" class="control">
      <input-activity v-model="selected" />
    </div>

    <div v-else-if="field.queryMode === 'date'">
      <date-query-item v-model="selected" :field="field" />
    </div>

    <div v-else-if="field.queryMode === 'dates'">
      <dates-query-item v-model="selected" :field="field" />
    </div>

    <div v-else class="notification is-danger">Please fill queryMode for {{ field.name }}</div>
  </div>
</template>

<script>
import 'vue-slider-component/theme/default.css';

import DateQueryItem from '../../views/documents/utils/DateQueryItem';
import DatesQueryItem from '../../views/documents/utils/DatesQueryItem';
import QueryItemSliderLabel from '../../views/documents/utils/QueryItemSliderLabel';

import debounce from '@/js/debounce';
import { requireFieldProperty } from '@/js/properties-mixins';

export default {
  /** Essentially the same as QueryItem but without the interaction with the URL */
  components: {
    Multiselect: () => import(/* webpackChunkName: "multiselect" */ 'vue-multiselect'),
    VueSlider: () => import(/* webpackChunkName: "slider" */ 'vue-slider-component'),
    QueryItemSliderLabel,
    DateQueryItem,
    DatesQueryItem,
  },

  mixins: [requireFieldProperty],

  props: {
    hideLabel: {
      type: Boolean,
      default: false,
    },
    value: {
      type: [Array, String, Number, Boolean],
      default: () => null,
    },
  },

  data() {
    return {
      selected: this.value ?? this.initialValue(),
    };
  },

  computed: {
    interval() {
      const scope = this.field.max - this.field.min;
      if (scope < 300) return 1;
      else if (scope < 1000) return 5;
      else if (scope < 3000) return 10;
      else return 25;
    },
  },

  watch: {
    selected(newVal) {
      this.$emit('input', newVal); // propagate changes to parent
    },
    value(newVal) {
      this.selected = newVal; // sync if parent updates
    },
  },

  methods: {
    gettext(key) {
      return this.$gettext(key, this.field.i18nContext);
    },

    initialValue() {
      if (!this.field) return null;
      if (this.field.queryMode === 'orientations') return [];
      if (this.field.queryMode === 'multiSelect' || this.field.queryMode === 'tristate') return [];
      if (this.field.queryMode === 'checkbox') return false;
      if (this.field.queryMode === 'valuesRangeSlider' || this.field.queryMode === 'numericalRangeSlider') {
        return [this.field.values?.[0] ?? 0, this.field.values?.[this.field.values.length - 1] ?? 0];
      }
      return '';
    },
  },
};
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>

<style scoped>
.multiselect--active {
  z-index: 6;
}
</style>
