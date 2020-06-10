<template>
  <div class="control" :class="{ 'has-error': hasError }">
    <span
      v-for="event_activity of event_activities"
      :key="event_activity"
      :checked="value_ === event_activity"
      :class="{ 'with-labels': showLabels }"
      class="input-item has-cursor-pointer"
      :title="showLabels ? null : $gettext(event_activity, 'event_activities')"
      @click="value_ = event_activity"
    >
      <icon-event-activity :event-activity="event_activity" />
      <span v-if="showLabels" class="is-size-6 input-label">
        {{ $gettext(event_activity, 'event_activities') }}
      </span>
    </span>
  </div>
</template>

<script>
import { baseMixin } from './mixins.js';
import constants from '@/js/constants';

export default {
  mixins: [baseMixin],

  props: {
    value: {
      type: String,
      default: null,
    },

    showLabels: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    event_activities() {
      return constants.event_activities;
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/sass/variables.scss';

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
