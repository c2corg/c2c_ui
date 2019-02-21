<template>
  <!-- This a generic component that display field value of a document for any kind of field  -->
  <span>

    <activities v-if="field.name=='activities'" :activities="document.activities" />

    <a v-else-if="field.type==='url'" :href="value">
      {{ value }}
    </a>

    <textual-array
      v-else-if="isArray"
      :array="value"
      :i18n="field.i18n"
      :i18n-context="field.i18nContext"/>

    <span v-else-if="typeof(value) === 'boolean'">
      <span v-if="value" v-translate>
        yes
      </span>
      <span v-else v-translate>
        no
      </span>
    </span>

    <span v-else-if="field.i18n">
      {{ $gettext(value, field.i18nContext) }}
    </span>

    <span v-else>{{ divisor ? Math.round(value / divisor) : value }}</span><!--
     --><span v-if="(unit || field.unit) && value !== null && value !== undefined">&nbsp;{{ unit || field.unit }}</span>

  </span>
</template>

<script>
  import { requireDocumentProperty, requireFieldProperty } from '@/js/properties-mixins';

  export default {

    mixins: [ requireDocumentProperty, requireFieldProperty ],

    props: {
      unit: {
        type: String,
        default: null
      },
      divisor: {
        type: Number,
        default: null
      }
    },

    computed: {
      value() {
        return this.document[this.field.name];
      },

      isArray() {
        return Array.isArray(this.value);
      }
    }
  };
</script>
