<template>
  <div class="columns is-mobile is-variable is-0">
    <div class="column date-container">
      <input-date v-model="date" />
    </div>
    <div class="column is-narrow hour-container">
      <div class="select">
        <select v-model="hour">
          <option v-for="i of hours" :key="i">{{ i }}</option>
        </select>
      </div>
    </div>
    <div class="column is-narrow minute-container">
      <div class="select">
        <select v-model="minute">
          <option v-for="i of minutes" :key="i">{{ i }}</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script>
import { baseMixin } from './mixins';

const range = (from, to) => [...Array(to - from + 1).keys()].map((i) => i + from);

export default {
  mixins: [baseMixin],

  props: {
    value: {
      type: String,
      default: null,
    },
  },

  computed: {
    minutes() {
      return range(0, 59);
    },
    hours() {
      return range(0, 23);
    },
    value_: {
      get() {
        return this.$dateUtils.parseDate(this.value);
      },
      set(value) {
        if (!this.disabled) {
          value = this.type !== 'number' || this.divisor === undefined || !value ? value : value * this.divisor;
          this.$emit('input', value);
        }
      },
    },
    date: {
      get() {
        return this.value ? this.$dateUtils.toLocalizedString(this.value_, 'YYYY-MM-DD') : null;
      },
      set(value) {
        const d = this.value_;
        value = this.$dateUtils.parseDate(value);

        d.setYear(value.getFullYear());
        d.setMonth(value.getMonth());
        d.setDate(value.getDate());

        this.onInput(d);
      },
    },
    hour: {
      get() {
        return this.value ? this.value_.getHours() : null;
      },
      set(value) {
        const d = this.value_;
        d.setHours(value);
        this.onInput(d);
      },
    },
    minute: {
      get() {
        return this.value ? this.value_.getMinutes() : null;
      },
      set(value) {
        const d = this.value_;
        d.setMinutes(value);
        this.onInput(d);
      },
    },
  },

  methods: {
    onInput(valueAsObject) {
      this.$emit('input', this.$dateUtils.toLocalizedString(valueAsObject, `YYYY-MM-DD[T]HH:mm:ssZ`));
    },
  },
};
</script>

<style scoped lang="scss">
.date-container {
  padding-right: 0.5rem !important;
}

.hour-container {
  .select select {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }
}
.minute-container {
  .select select {
    border-left: 0;
    border-top-left-radius: 0;
    border-bottom-left-radius: 0;
  }
}
</style>
