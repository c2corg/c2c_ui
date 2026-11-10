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
