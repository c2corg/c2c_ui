import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { h, reactive, ref, type Component, type Ref, type VNode } from 'vue';

import { type FormFieldState, useFormContainer, useFormField } from './form-registration';

// a field as a <script setup> component is in production: its template is a render function returned by its setup,
// so its instance proxy has none of its state
const fieldWith = (state: FormFieldState): Component => ({
  setup() {
    useFormField('formSection', state);
    return () => h('input');
  },
});

// a container rendering the given content, its registered fields put in fields
function mountContainer(content: () => VNode | null) {
  const fields: { ref?: Ref<FormFieldState[]> } = {};
  const wrapper = mount({
    setup() {
      fields.ref = useFormContainer('formSection').formFields;
      return () => h('div', [content()]);
    },
  });
  return { wrapper, fields: fields.ref! };
}

describe('useFormField', () => {
  it('registers the state the field gives, and the container follows it', () => {
    const hasError = ref(false);
    const Field = fieldWith(reactive({ visible: true, hasError }));

    const { fields } = mountContainer(() => h(Field));

    expect(fields.value).toHaveLength(1);
    expect(fields.value[0].visible).toBe(true);
    expect(fields.value[0].hasError).toBe(false);

    hasError.value = true;

    expect(fields.value[0].hasError).toBe(true);
  });

  it('is forgotten when unmounted', async () => {
    const shown = ref(true);
    const Field = fieldWith(reactive({ visible: true }));

    const { wrapper, fields } = mountContainer(() => (shown.value ? h(Field) : null));
    expect(fields.value).toHaveLength(1);

    shown.value = false;
    await wrapper.vm.$nextTick();

    expect(fields.value).toHaveLength(0);
  });

  it('works outside a container', () => {
    expect(() => mount(fieldWith(reactive({ visible: true })))).not.toThrow();
  });
});
