import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, isProxy } from 'vue';

import MarkdownEditor from './MarkdownEditor.vue';

const EditorButton = defineComponent({
  name: 'EditorButton',
  props: ['icon'],
  emits: ['click'],
  setup:
    (props, { emit }) =>
    () =>
      h('button', { class: props.icon, onClick: () => emit('click') }),
});

const mountEditor = (modelValue: string) =>
  mount(MarkdownEditor, {
    props: { modelValue },
    attachTo: document.body,
    global: {
      config: {
        globalProperties: {
          $gettext: (text: string) => text,
          $filters: { uppercaseFirstLetter: (text: string) => text },
        } as never,
      },
      stubs: { EditorButton, LinkHelper: true, Markdown: true },
      directives: { translate: {} },
    },
  });

describe('MarkdownEditor', () => {
  it('keeps its selection helper (around the textarea) as it is, not proxied', () => {
    const wrapper = mountEditor('Text');

    const { selection } = wrapper.vm as unknown as { selection: object };
    expect(selection).toBeTruthy();
    expect(isProxy(selection)).toBe(false);
  });

  it('shows the value, and follows it', async () => {
    const wrapper = mountEditor('Text');
    const textarea = wrapper.find('textarea').element;
    expect(textarea.value).toBe('Text');

    await wrapper.setProps({ modelValue: 'Other text' });
    expect(textarea.value).toBe('Other text');
  });

  it('puts the selected text in bold, then back', async () => {
    const wrapper = mountEditor('a bold word');
    const textarea = wrapper.find('textarea').element;
    textarea.setSelectionRange(2, 6);

    await wrapper.find('button.bold').trigger('click');
    expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['a **bold** word']);

    await wrapper.find('button.bold').trigger('click');
    expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['a bold word']);
    wrapper.unmount();
  });

  it('makes a list of the selected lines', async () => {
    const wrapper = mountEditor('one\ntwo');
    wrapper.find('textarea').element.setSelectionRange(0, 7);

    await wrapper.find('button.list-ul').trigger('click');

    expect(wrapper.emitted('update:modelValue')!.at(-1)).toEqual(['* one\n* two']);
    wrapper.unmount();
  });
});
