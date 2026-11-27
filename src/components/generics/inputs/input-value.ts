// v-model of the inputs: the props they share, and their value_, read from modelValue and written with
// update:modelValue (number inputs may show it divided by a divisor)
import { computed, ref } from 'vue';

import { parseDecimal } from '@/js/length-format';

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

type InputProps = {
  modelValue?: unknown;
  type?: string;
  divisor?: number;
  disabled?: boolean | null;
  min?: number | null;
  max?: number | string | null;
};

export function useInputValue(props: InputProps, emit: Emit) {
  const divided = () => props.type === 'number' && props.divisor !== undefined;

  // a divided number is typed as text, so that both 4.5 and 4,5 are read: invalid when it is not a number
  const invalid = ref(false);

  const value_ = computed({
    get: () =>
      !divided() || !props.modelValue ? props.modelValue : (props.modelValue as number) / (props.divisor as number),
    set(value: unknown) {
      if (props.disabled) {
        return;
      }

      if (!divided()) {
        emit('update:modelValue', value);
        return;
      }

      if (value === null || value === undefined || String(value).trim() === '') {
        invalid.value = false;
        emit('update:modelValue', null);
        return;
      }

      const parsed = typeof value === 'number' ? value : parseDecimal(String(value));
      const stored = parsed * (props.divisor as number);
      // min and max are in the stored unit; a text input does not check them. Checked before rounding: -0.0001 km
      // would round to -0, accepted by min 0
      invalid.value =
        Number.isNaN(stored) ||
        (props.min !== null && props.min !== undefined && stored < props.min) ||
        (props.max !== null && props.max !== undefined && stored > Number(props.max));
      const number = Math.round(stored);

      // the API stores integers (metres): 0.5605 km is 561 m, and 1.005 km 1005 m, not 1004.9999999999999
      if (!invalid.value) {
        emit('update:modelValue', number);
      }
    },
  });

  return { value_, invalid };
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
