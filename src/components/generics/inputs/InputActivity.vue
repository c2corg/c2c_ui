<template>
  <div class="control" :class="{ 'has-error': hasError }">
    <span
      v-for="activity of activities"
      :key="activity"
      :checked="value_.includes(activity)"
      :class="{ 'with-labels': showLabels }"
      class="input-item has-cursor-pointer"
      :title="showLabels ? null : $gettext(activity, 'activities')"
      @click="toggle(activity)"
    >
      <icon-activity :activity="activity" />
      <span v-if="showLabels" class="is-size-6 input-label">
        {{ $gettext(activity, 'activities') }}
      </span>
    </span>
  </div>
</template>

<script>
import { arrayMixin, baseMixin } from './mixins';

import constants from '@/js/constants';

export default {
  mixins: [baseMixin, arrayMixin],

  props: {
    showLabels: {
      type: Boolean,
      default: false,
    },
    documentType: {
      type: String,
      default: undefined,
    },
  },

  computed: {
    activities() {
      if (this.documentType === 'r') {
        // remove paragliding for routes
        return constants.activities.filter((act) => act !== 'paragliding');
      }
      return constants.activities;
    },
  },
};
</script>

<style scoped lang="scss">
.input-item {
  font-size: 40px;
  margin: 4px;
  color: #888;
  transition: color 300ms;
  user-select: none;

  svg {
    background: white;
    border-radius: 100%;
    box-shadow: 2px 2px 4px grey;
    transition: box-shadow 100ms;
  }
}

.input-item:hover {
  svg {
    box-shadow: 3px 3px 5px grey;
  }
}

.input-item[checked] {
  color: $primary;
}

.with-labels {
  width: 100px;
  display: inline-flex;
  flex-direction: column;

  svg {
    margin: auto;
  }

  .input-label {
    text-align: center;
  }
}

.has-error {
  box-shadow: 0px 0px 8px 0px $danger;
  // border: 1px solid $danger;
}
</style>
