<template>
  <div class="transport-day">
    <button
      class="button is-small"
      type="button"
      :disabled="!hasPrevious"
      :title="$gettext('Previous day')"
      @click="$emit('update:modelValue', previousDay)"
    >
      <img src="@/assets/img/boxes/before.svg" alt="" />
    </button>
    <strong class="transport-day-label">{{ label }}</strong>
    <button
      class="button is-small"
      type="button"
      :disabled="!hasNext"
      :title="$gettext('Next day')"
      @click="$emit('update:modelValue', nextDay)"
    >
      <img src="@/assets/img/boxes/after.svg" alt="" />
    </button>
  </div>
</template>

<script>
import { addDays, formatDay, timetableDays } from '@/js/transport-utils';

export default {
  props: {
    // the day, YYYY-MM-DD
    modelValue: {
      type: String,
      required: true,
    },
  },

  emits: ['update:modelValue'],

  computed: {
    previousDay() {
      return addDays(this.modelValue, -1);
    },

    nextDay() {
      return addDays(this.modelValue, 1);
    },

    // the API answers for the days from today, on a year
    days() {
      return timetableDays();
    },

    hasPrevious() {
      return this.previousDay >= this.days[0];
    },

    hasNext() {
      return this.nextDay <= this.days[1];
    },

    label() {
      return formatDay(this.modelValue, this.$language.current);
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
