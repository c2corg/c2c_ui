<template>
  <div :class="['control', 'input-radio-group', { 'input-radio-vertical': displayVertically }]">
    <label class="input-radio-button" v-for="option in options" :key="option.value">
      <input type="radio" :value="option.value" v-model="selected" @change="emitSelectedValue" />
      {{ option.text }}
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
    defaultValue: {
      type: String,
      default: '',
    },
    displayVertically: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      selected: this.value || this.defaultValue,
    };
  },
  watch: {
    value(newValue) {
      this.selected = newValue;
    },
  },
  methods: {
    emitSelectedValue() {
      this.$emit('input', this.selected);
    },
  },
};
</script>

<style scoped lang="scss">
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
  flex-direction: column !important;
  gap: 8px;
}
</style>
