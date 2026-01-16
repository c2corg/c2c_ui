<template>
  <div class="time-input">
    <div class="hour-container">
      <select v-model="hour">
        <option v-for="i of hours" :key="i">{{ i }}</option>
      </select>
    </div>

    <span class="time-separator">:</span>

    <div class="minute-container">
      <select v-model="minute">
        <option v-for="i of minutes" :key="i">{{ i }}</option>
      </select>
    </div>
  </div>
</template>

<script>
const range = (from, to) => [...Array(to - from + 1).keys()].map((i) => String(i + from).padStart(2, '0'));

export default {
  props: {
    value: {
      type: String, // "HH:mm"
      default: null,
    },
  },

  computed: {
    hours() {
      return range(0, 23);
    },
    minutes() {
      return range(0, 59);
    },

    hour: {
      get() {
        return this.value?.split(':')[0] ?? '00';
      },
      set(h) {
        this.emitTime(h, this.minute);
      },
    },

    minute: {
      get() {
        return this.value?.split(':')[1] ?? '00';
      },
      set(m) {
        this.emitTime(this.hour, m);
      },
    },
  },

  methods: {
    emitTime(h, m) {
      this.$emit('input', `${h}:${m}`);
    },
  },
};
</script>

<style scoped lang="scss">
.time-input {
  display: inline-flex;
  align-items: center;

  background: #fff;
  font-size: 15px;
  color: #333;

  border: none;
}

.time-input:focus-within {
  border: none;
  box-shadow: none;
}

.time-input .minute-container,
.time-input .hour-container {
  border: none;
}

.time-input .minute-container::after,
.time-input .hour-container::after {
  display: none;
}

.time-input select {
  appearance: none;
  background: transparent;
  border: none;
  outline: none;
  box-shadow: none;

  width: auto;
  padding: 4px 6px;
  margin: 0;

  text-align: center;
  font-size: inherit;
  color: inherit;

  cursor: pointer;
  border-radius: 4px;

  transition: background 0.15s ease;
}

.time-input select:hover {
  background: rgba(0, 0, 0, 0.06);
}

.time-input select:focus {
  background: rgba(50, 115, 220, 0.12);
}

.time-separator {
  padding: 0 2px;
  pointer-events: none;
  user-select: none;
  font-weight: 500;
}
</style>
