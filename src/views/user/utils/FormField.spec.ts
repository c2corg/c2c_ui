import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import FormField from './FormField.vue';

describe('user FormField', () => {
  // the login view focuses the main input of each of its forms through a template ref
  it('focuses its input', () => {
    const wrapper = mount(FormField, {
      props: { name: 'username', label: 'Username', type: 'text', icon: 'user', modelValue: '' },
      global: { stubs: { FaIcon: true }, config: { globalProperties: { $gettext: (text: string) => text } as never } },
      attachTo: document.body,
    });

    (wrapper.vm as unknown as { focus(): void }).focus();

    expect(document.activeElement).toBe(wrapper.find('input').element);
    wrapper.unmount();
  });
});
