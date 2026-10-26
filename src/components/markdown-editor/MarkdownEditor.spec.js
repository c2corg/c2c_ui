import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { isProxy } from 'vue';

import MarkdownEditor from './MarkdownEditor';

describe('MarkdownEditor', () => {
  it('keeps its selection helper (around the textarea) as it is, not proxied', () => {
    const wrapper = mount(MarkdownEditor, {
      props: { modelValue: 'Text' },
      global: {
        mocks: { $gettext: (text) => text, $filters: { uppercaseFirstLetter: (text) => text } },
        stubs: { FaIcon: true, EditorButton: true },
        directives: { translate: {} },
      },
    });

    expect(wrapper.vm.selection).toBeTruthy();
    expect(isProxy(wrapper.vm.selection)).toBe(false);
  });
});
