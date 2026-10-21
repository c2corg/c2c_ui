<template>
  <div class="transport-day">
    <button
      class="button is-small"
      :disabled="!hasPrevious"
      :title="$gettext('Previous day')"
      @click="$emit('input', previousDay)"
    >
      <img src="@/assets/img/boxes/before.svg" alt="" />
    </button>
    <strong class="transport-day-label">{{ label }}</strong>
    <button class="button is-small" :disabled="!hasNext" :title="$gettext('Next day')" @click="$emit('input', nextDay)">
      <img src="@/assets/img/boxes/after.svg" alt="" />
    </button>
  </div>
</template>

<script>
import { addDays, fromIsoDate, lastDay } from '@/js/transport-utils';

export default {
  props: {
    // the day, YYYY-MM-DD
    value: {
      type: String,
      required: true,
    },

    // the first day of the timetables, and their services (see transport-utils)
    start: {
      type: String,
      required: true,
    },

    services: {
      type: Object,
      required: true,
    },
  },

  emits: ['input'],

  computed: {
    previousDay() {
      return addDays(this.value, -1);
    },

    nextDay() {
      return addDays(this.value, 1);
    },

    hasPrevious() {
      return this.previousDay >= this.start;
    },

    hasNext() {
      return this.nextDay <= lastDay(this.start, this.services);
    },

    label() {
      const date = fromIsoDate(this.value);
      try {
        return new Intl.DateTimeFormat(this.$language.current, {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        }).format(date);
      } catch (e) {
        return this.value;
      }
    },
  },
};
</script>

<style scoped lang="scss">
.transport-day {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75em;
  margin: 0.5em 0;

  img {
    height: 1em;
  }
}

.transport-day-label {
  min-width: 11em;
  text-align: center;
  text-transform: capitalize;
}
</style>
