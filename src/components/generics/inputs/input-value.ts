// v-model of the inputs: the props they share, and their value_, read from modelValue and written with
// update:modelValue (number inputs may show it divided by a divisor)
import { computed } from 'vue';

export const baseInputProps = {
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
};

// the inputs of several values: a list of them
export const arrayInputProps = {
  modelValue: {
    type: Array,
    default: null,
  },
};

type Emit = (event: 'update:modelValue', value: unknown) => void;

type InputProps = { modelValue?: unknown; type?: string; divisor?: number; disabled?: boolean | null };

export function useInputValue(props: InputProps, emit: Emit) {
  const divided = () => props.type === 'number' && props.divisor !== undefined;

  const value_ = computed({
    get: () =>
      !divided() || !props.modelValue ? props.modelValue : (props.modelValue as number) / (props.divisor as number),
    set(value: unknown) {
      if (!props.disabled) {
        emit('update:modelValue', !divided() || !value ? value : (value as number) * (props.divisor as number));
      }
    },
  });

  return { value_ };
}

/** The values with the item added, or removed if it was there; null when a required input would be left empty */
export function toggledValues(values: unknown[], item: unknown, required?: boolean | null): unknown[] | null {
  const newValue = values.slice(0);

  if (!newValue.includes(item)) {
    newValue.push(item);
  } else {
    newValue.splice(newValue.indexOf(item), 1);
  }

  return newValue.length !== 0 || !required ? newValue : null;
}

export function useArrayInputValue(props: InputProps & { required?: boolean | null }, emit: Emit) {
  const value_ = computed({
    get: () => (props.modelValue as unknown[] | null) ?? [],
    set(value: unknown[]) {
      if (!props.disabled) {
        emit('update:modelValue', value);
      }
    },
  });

  function toggle(item: unknown) {
    if (props.disabled) {
      return;
    }
    const newValue = toggledValues(value_.value, item, props.required);
    if (newValue) {
      value_.value = newValue;
    }
  }

  return { value_, toggle };
}
