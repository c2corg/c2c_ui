<template>
  <div :class="['control', 'input-radio-group', { 'input-radio-vertical': displayVertically }]">
    <label class="input-radio-button" v-for="option in options" :key="option.value">
      <input
        type="radio"
        :value="option.value"
        v-model="selected"
        @change="emitSelectedValue"
        :disabled="disabledValues.has(option.value)"
      />
      <div class="option">
        {{ option.text }}
        <p v-if="reasons[option.value]" class="optionDisabled">{{ reasons[option.value] }}</p>
      </div>
    </label>
  </div>
</template>

<script>
export default {
  props: {
    options: {
      type: Array,
      required: true,
    },
    disabledOptions: {
      type: Array,
      default: () => [],
    },
    defaultValue: {
      type: String,
      default: '',
    },
    displayVertically: {
      type: Boolean,
      default: false,
    },
    value: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      selected: this.value || this.defaultValue,
    };
  },
  computed: {
    reasons() {
      const reasons = {};
      this.disabledOptions.forEach((option) => {
        reasons[option.value] = option.reason;
      });
      return reasons;
    },
    disabledValues() {
      return new Set(this.disabledOptions.map((option) => option.value));
    },
  },
  watch: {
    value(newValue) {
      this.selected = newValue;
    },
  },
  mounted() {
    if (this.selected) {
      this.$emit('input', this.selected);
    }
  },
  methods: {
    emitSelectedValue() {
      this.$emit('input', this.selected);
    },
  },
};
</script>

<style scoped lang="scss">
.option {
  display: flex;
  flex-direction: column;
  .optionDisabled {
    color: red;
    font-size: 12px;
    font-style: italic;
  }
}
.input-radio-group {
  display: flex;
  gap: 16px;

  .input-radio-button {
    align-items: center;
    display: flex;
    gap: 8px;
  }
}

.input-radio-vertical {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
