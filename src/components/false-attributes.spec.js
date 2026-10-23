import { configureCompat } from '@vue/compat'; // the vue alias: the same Vue the components run on
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

import InputActivity from '@/components/generics/inputs/InputActivity';
import InputEventActivity from '@/components/generics/inputs/InputEventActivity';
import InputMultiSelect from '@/components/generics/inputs/InputMultiSelect';
import EditorButton from '@/components/markdown-editor/EditorButton';
import PageSelector from '@/views/documents/utils/PageSelector';

// Vue 3 renders attr="false" for an attribute bound to false (Vue 2 removed it), which CSS selectors such as
// [checked] or Bulma's .button[disabled] then match. With the Vue 3 behaviour (no compat for it in this file), the
// attributes must still be absent when false.
configureCompat({ ATTR_FALSE_VALUE: false });

const global = {
  mocks: { $gettext: (text) => text, $filters: { uppercaseFirstLetter: (text) => text }, $route: { query: {} } },
  stubs: { IconActivity: true, IconEventActivity: true, FaIcon: true, RouterLink: { template: '<a><slot /></a>' } },
};

const checkedItems = (wrapper, selector) =>
  wrapper.findAll(selector).map((item) => item.attributes('checked') !== undefined);

describe('attributes bound to false', () => {
  it('InputActivity marks only the chosen activities', () => {
    const wrapper = mount(InputActivity, { props: { modelValue: ['hiking'] }, global });
    const checked = checkedItems(wrapper, '.input-item');
    expect(checked.filter(Boolean)).toHaveLength(1);
  });

  it('InputEventActivity marks only the chosen activity', () => {
    const wrapper = mount(InputEventActivity, { props: { modelValue: null }, global });
    expect(checkedItems(wrapper, '.input-item').filter(Boolean)).toHaveLength(0);
  });

  it('InputMultiSelect marks only the chosen options', () => {
    const wrapper = mount(InputMultiSelect, { props: { modelValue: ['b'], options: ['a', 'b', 'c'] }, global });
    expect(checkedItems(wrapper, '.multi-select-item')).toEqual([false, true, false]);
  });

  it('EditorButton is disabled only when it is', () => {
    expect(mount(EditorButton, { props: { disabled: false }, global }).attributes('disabled')).toBeUndefined();
    expect(mount(EditorButton, { props: { disabled: true }, global }).attributes('disabled')).toBeDefined();
  });

  it('PageSelector disables only the arrows at the ends', async () => {
    const wrapper = mount(PageSelector, { props: { documents: null }, global });
    await wrapper.setProps({ documents: { total: 100 } }); // as when the list is loaded
    const arrows = wrapper.findAll('.pagination-link').map((arrow) => arrow.attributes('disabled') !== undefined);
    expect(arrows).toEqual([true, false]); // first page: previous disabled, next enabled
  });
});
