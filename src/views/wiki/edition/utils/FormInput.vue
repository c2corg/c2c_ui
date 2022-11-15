<template>
  <input-activity
    v-if="field.name == 'activities'"
    v-show="visible"
    :has-error="hasError"
    show-labels
    :document-type="document.type"
    v-model="document.activities"
  />

  <input-event-activity
    v-else-if="field.name == 'event_activity'"
    v-show="visible"
    :has-error="hasError"
    show-labels
    v-model="document.event_activity"
  />

  <input-orientation v-else-if="field.name == 'orientations'" v-show="visible" v-model="document.orientations" />

  <div v-else-if="field.name == 'main_waypoint_id'" class="control select" :class="{ 'is-danger': hasError }">
    <select v-model="document.main_waypoint_id">
      <option :value="null" />
      <option
        v-for="waypoint of document.associations.waypoints"
        :key="waypoint.document_id"
        :value="waypoint.document_id"
      >
        {{ $documentUtils.getDocumentTitle(waypoint) }}
      </option>
    </select>
  </div>

  <input-conditions-levels v-else-if="field.name == 'conditions_levels'" v-model="object[field.name]" />

  <input-markdown
    v-else-if="field.type == 'markdown'"
    v-show="visible"
    :placeholder="placeholder"
    v-model="object[field.name]"
  />

  <input-document
    v-else-if="field.parent == 'associations'"
    :document-type="field.documentType"
    multiple
    clear-input-on-toggle
    :has-error="hasError"
    @add="$documentUtils.propagateProperties(document, arguments[0])"
    v-model="object[field.name]"
  />

  <input-multi-select
    v-else-if="field.values && field.multiple"
    v-show="visible"
    :options="field.values"
    :required="field.required"
    :i18n="field.i18n"
    :i18n-context="field.i18nContext"
    :has-error="hasError"
    v-model="object[field.name]"
  />

  <input-date
    v-else-if="field.type === 'date'"
    :has-error="hasError"
    :disabled-dates="disabledDates"
    :required="field.required"
    v-model="object[field.name]"
  />

  <input-simple
    ref="input"
    v-else-if="simpleInputType"
    v-show="visible"
    :prefix="prefix"
    @click-prefix="$emit('click-prefix')"
    :is-expanded="isExpanded"
    :postfix="unit || field.unit"
    :divisor="divisor"
    :type="field.type"
    :min="min || field.min"
    :max="max || field.max"
    :disabled="field.disabled"
    :placeholder="placeholder || $gettext(field.name)"
    :required="field.required"
    :i18n="field.i18n"
    :i18n-context="field.i18nContext"
    :options="field.values"
    :has-error="hasError"
    @input="$emit('input', arguments[0])"
    v-model="object[field.name]"
  />

  <input-yes-no
    v-else-if="field.type == 'boolean'"
    v-show="visible"
    v-model="object[field.name]"
    :nullable="field.nullable"
  />

  <input-datetime v-else-if="field.type == 'date_time'" v-show="visible" v-model="object[field.name]" />

  <div v-else class="notification is-danger">
    <!-- Should not happen, message to devs -->
    Unknown field type : {{ field.type }}
  </div>
</template>

<script>
import dayjs from 'dayjs';

import InputConditionsLevels from './InputConditionsLevels';

import { requireDocumentProperty, requireFieldProperty } from '@/js/properties-mixins';

export default {
  components: { InputConditionsLevels },

  mixins: [requireFieldProperty, requireDocumentProperty],

  props: {
    prefix: {
      type: String,
      default: null,
    },
    isExpanded: {
      type: Boolean,
      default: null,
    },
    placeholder: {
      type: String,
      default: undefined,
    },
    min: {
      type: String,
      default: undefined,
    },
    max: {
      type: String,
      default: undefined,
    },
    unit: {
      type: String,
      default: undefined,
    },
    divisor: {
      type: Number,
      default: undefined,
    },
  },

  computed: {
    disabledDates() {
      const min = this.min || this.field.min;
      const max = this.max || this.field.max;

      return {
        to: min ? dayjs(min).toDate() : undefined,
        from: max ? dayjs(max).add(1, 'day').toDate() : undefined,
      };
    },

    editedLocale() {
      // in edit mode, there is only one locale
      return this.document.locales[0];
    },

    object() {
      if (this.field.parent === 'document') {
        return this.document;
      }

      if (this.field.parent === 'locales') {
        return this.editedLocale;
      }

      if (this.field.parent === 'associations') {
        return this.document.associations;
      }

      throw new Error(`Unexpected parent value : ${this.field.parent}`);
    },
    visible() {
      return this.field.isVisibleFor(this.document);
    },
    simpleInputType() {
      return ['text', 'number', 'url', 'tel'].includes(this.field.type);
    },
    hasError() {
      return this.field.error !== null;
    },
  },
};
</script>
