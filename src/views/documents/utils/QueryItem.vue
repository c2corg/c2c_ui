<template>
  <div v-if="field !== undefined" class="field">
    <div v-if="field.queryMode === 'valuesRangeSlider'" class="control">
      <query-item-slider-label :field="field" :value="value" :label-id="sliderLabelId" />
      <input-slider
        v-model="valueIndexes"
        :max="field.values.length - 1"
        :format="formatValueIndex"
        :aria-labelledby="sliderLabelId"
        marks
      />
    </div>

    <div v-else-if="field.queryMode === 'numericalRangeSlider'" class="control">
      <query-item-slider-label :field="field" :value="value" :label-id="sliderLabelId" />
      <input-slider
        v-model="value"
        :min="field.min"
        :max="field.max"
        :step="interval"
        :aria-labelledby="sliderLabelId"
      />
    </div>

    <div v-else-if="field.queryMode === 'multiSelect'" class="control">
      <label class="label">
        {{ $filters.uppercaseFirstLetter($gettext(field.name)) }}
      </label>

      <multiselect
        v-model="value"
        :options="field.values"
        :custom-label="field.i18n ? gettext : undefined"
        :placeholder="$gettext('Select option')"
        :select-label="$gettext('Press enter to select')"
        :multiple="true"
      />
    </div>

    <div v-else-if="field.queryMode === 'orientations'" class="level">
      <input-orientation v-model="value" class="level-item" />
    </div>

    <div v-else-if="field.queryMode === 'input'" class="control">
      <label class="label" v-if="!hideLabel">
        {{ $filters.uppercaseFirstLetter($gettext(field.name)) }}
      </label>
      <input
        ref="input"
        :type="field.type"
        :value="value"
        @input="oninput"
        class="input"
        :placeholder="$gettext(field.name)"
      />
    </div>

    <div v-else-if="field.queryMode === 'tristate'" class="control">
      <label class="label">
        {{ $filters.uppercaseFirstLetter($gettext(field.name)) }}
      </label>

      <multiselect
        v-model="value"
        :options="['yes', 'no', 'no info']"
        :custom-label="gettext"
        :placeholder="$gettext('Select option')"
        :select-label="$gettext('Press enter to select')"
      />
    </div>

    <div v-else-if="field.queryMode === 'checkbox'" class="control">
      <input-checkbox v-model="value">
        {{ $gettext(field.name) }}
      </input-checkbox>
    </div>

    <div v-else-if="field.queryMode === 'activities'" class="control">
      <input-activity v-model="value" />
    </div>

    <div v-else-if="field.queryMode === 'date'">
      <date-query-item />
    </div>

    <div v-else-if="field.queryMode === 'dates'">
      <dates-query-item />
    </div>

    <div v-else class="notification is-danger">
      <!-- Should not happen, message for devs -->
      Please fill queryMode for {{ field.name }}
    </div>
  </div>
</template>

<script>
import DateQueryItem from './DateQueryItem';
import DatesQueryItem from './DatesQueryItem';
import QueryItemSliderLabel from './QueryItemSliderLabel';
import queryItemMixin from './query-item-mixin';

import debounce from '@/js/debounce';
import { requireFieldProperty } from '@/js/properties-mixins';
import { uidMixin } from '@/js/uid';

export default {
  components: {
    Multiselect: () => import('vue-multiselect'),
    QueryItemSliderLabel,
    DateQueryItem,
    DatesQueryItem,
  },

  mixins: [requireFieldProperty, queryItemMixin, uidMixin],

  props: {
    hideLabel: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    // the field name names the slider handles for assistive technologies
    sliderLabelId() {
      return `query-slider-label-${this.uid}`;
    },

    // a range of field.values (ratings...): the slider works on their indexes
    valueIndexes: {
      get() {
        return this.value.map((value) => this.field.values.indexOf(value));
      },
      set(indexes) {
        this.value = indexes.map((index) => this.field.values[index]);
      },
    },

    interval() {
      const scope = this.field.max - this.field.min;

      if (scope < 300) {
        return 1;
      } else if (scope < 1000) {
        return 5;
      } else if (scope < 3000) {
        return 10;
      } else {
        return 25;
      }
    },
  },

  methods: {
    formatValueIndex(index) {
      const value = this.field.values[Math.round(index)];
      return this.field.i18n ? this.gettext(value) : value;
    },

    gettext(key) {
      return this.$gettext(key, this.field.i18nContext);
    },

    // for simple input, add a small delay (avoir spamming API, and url history)
    oninput: debounce(function () {
      this.value = this.$refs.input.value;
    }, 300),
  },
};
</script>

<style src="vue-multiselect/dist/vue-multiselect.min.css"></style>

<style scoped>
/*
If a multi select is below a slider, multi select  popup is bellow slider elements.
set z-index to 6 (5 is the highest slider z-index value) to fix this
*/
.multiselect--active {
  z-index: 6;
}
</style>
