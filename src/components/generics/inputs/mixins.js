export const baseMixin = {
  props: {
    type: {
      type: String,
      default: 'text',
    },
    disabled: {
      type: Boolean,
      default: null,
    },
    required: {
      type: Boolean,
      default: null,
    },
    hasError: {
      type: Boolean,
      default: false,
    },
    i18n: {
      type: Boolean,
      default: false,
    },
    divisor: {
      type: Number,
      default: undefined,
    },
    placeholder: {
      type: String,
      default: null,
    },
  },

  computed: {
    value_: {
      get() {
        return this.type !== 'number' || this.divisor === undefined || !this.modelValue
          ? this.modelValue
          : this.modelValue / this.divisor;
      },
      set(value) {
        if (!this.disabled) {
          value = this.type !== 'number' || this.divisor === undefined || !value ? value : value * this.divisor;
          this.$emit('update:modelValue', value);
        }
      },
    },
  },
};

export const arrayMixin = {
  props: {
    modelValue: {
      type: Array,
      default: null,
    },
  },

  computed: {
    value_: {
      get() {
        return this.modelValue ? this.modelValue : [];
      },
      set(value) {
        if (!this.disabled) {
          this.$emit('update:modelValue', value);
        }
      },
    },
  },

  methods: {
    toggle(item) {
      if (this.disabled) {
        return;
      }

      const newValue = this.value_.slice(0);

      if (!newValue.includes(item)) {
        newValue.push(item);
      } else {
        newValue.splice(newValue.indexOf(item), 1);
      }

      if (newValue.length !== 0 || !this.required) {
        this.value_ = newValue;
      }
    },
  },
};
