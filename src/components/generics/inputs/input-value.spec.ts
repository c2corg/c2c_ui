import { describe, expect, it } from 'vitest';
import { reactive } from 'vue';

import { toggledValues, useArrayInputValue, useInputValue } from './input-value';

// the events an input emits
const emitter = () => {
  const emitted: unknown[] = [];
  return { emitted, emit: (_: 'update:modelValue', value: unknown) => void emitted.push(value) };
};

describe('useInputValue', () => {
  it('gives the value, and emits the new one', () => {
    const { emitted, emit } = emitter();
    const { value_ } = useInputValue(reactive({ modelValue: 'Mont Blanc', type: 'text' }), emit);

    expect(value_.value).toBe('Mont Blanc');
    value_.value = 'Aiguille Verte';
    expect(emitted).toEqual(['Aiguille Verte']);
  });

  it('shows a number divided by its divisor, and emits it multiplied back', () => {
    const { emitted, emit } = emitter();
    const { value_ } = useInputValue(reactive({ modelValue: 3600, type: 'number', divisor: 60 }), emit);

    expect(value_.value).toBe(60);
    value_.value = 90;
    expect(emitted).toEqual([5400]);
  });

  it('reads a divided number typed with a comma or a dot, and rounds it to an integer', () => {
    const { emitted, emit } = emitter();
    const { value_, invalid } = useInputValue(reactive({ modelValue: 560, type: 'number', divisor: 1000 }), emit);

    expect(value_.value).toBe(0.56);
    value_.value = '4,5';
    value_.value = '0.5605';
    value_.value = '1.005';
    expect(emitted).toEqual([4500, 561, 1005]);
    expect(invalid.value).toBe(false);
  });

  it('marks a divided number invalid when it is not a number or out of range, and keeps the value', () => {
    const { emitted, emit } = emitter();
    const props = reactive({ modelValue: 560, type: 'number', divisor: 1000, min: 0, max: 500000 });
    const { value_, invalid } = useInputValue(props, emit);

    value_.value = '4.5 km';
    expect(invalid.value).toBe(true);
    value_.value = '-1';
    expect(invalid.value).toBe(true);
    value_.value = '501';
    expect(invalid.value).toBe(true);
    expect(emitted).toEqual([]);

    value_.value = '3';
    expect(invalid.value).toBe(false);
    expect(emitted).toEqual([3000]);
  });

  it('empties a divided number', () => {
    const { emitted, emit } = emitter();
    const { value_, invalid } = useInputValue(reactive({ modelValue: 560, type: 'number', divisor: 1000 }), emit);

    value_.value = 'x';
    value_.value = ' ';
    expect(invalid.value).toBe(false);
    expect(emitted).toEqual([null]);
  });

  it('emits nothing when disabled', () => {
    const { emitted, emit } = emitter();
    const { value_ } = useInputValue(reactive({ modelValue: 'x', disabled: true }), emit);

    value_.value = 'y';
    expect(emitted).toEqual([]);
  });
});

describe('useArrayInputValue', () => {
  it('gives the values (none for null), and toggles one', () => {
    const { emitted, emit } = emitter();
    const props = reactive({ modelValue: null as string[] | null });
    const { value_, toggle } = useArrayInputValue(props, emit);

    expect(value_.value).toEqual([]);
    props.modelValue = ['N', 'E'];
    toggle('S');
    toggle('E');
    expect(emitted).toEqual([['N', 'E', 'S'], ['N']]);
  });

  it('keeps the last value of a required input, and ignores toggles when disabled', () => {
    const required = emitter();
    useArrayInputValue(reactive({ modelValue: ['skitouring'], required: true }), required.emit).toggle('skitouring');
    expect(required.emitted).toEqual([]);

    const disabled = emitter();
    useArrayInputValue(reactive({ modelValue: [], disabled: true }), disabled.emit).toggle('hiking');
    expect(disabled.emitted).toEqual([]);
  });

  it('toggles without changing the values it was given', () => {
    const values = ['a'];
    expect(toggledValues(values, 'b')).toEqual(['a', 'b']);
    expect(values).toEqual(['a']);
    expect(toggledValues(['a'], 'a', true)).toBeNull();
  });
});
