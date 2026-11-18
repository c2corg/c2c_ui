import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import QueryItem from './QueryItem.vue';

import constants from '@/js/constants';

// vue-multiselect, as far as the filter goes: its options and its value
const Multiselect = defineComponent({
  props: { options: { type: Array, default: () => [] }, modelValue: { type: String, default: undefined } },
  emits: ['update:modelValue'],
  render() {
    return h('div', { class: 'multiselect' }, (this.options as string[]).join('|'));
  },
});

const mountItem = async (fieldName: string, path = '/outings') => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/outings', name: 'outings', component: { render: () => h('div') } }],
  });
  await router.push(path);
  const wrapper = mount(QueryItem, {
    props: { field: constants.objectDefinitions.outing.fields[fieldName] },
    global: {
      plugins: [router],
      stubs: { Multiselect },
      config: {
        globalProperties: {
          $gettext: (text: string) => text,
          $filters: { uppercaseFirstLetter: (text: string) => text.charAt(0).toUpperCase() + text.slice(1) },
        } as never,
      },
    },
  });
  await flushPromises();
  return { wrapper, router };
};

describe('QueryItem', () => {
  it('offers yes and no for the GPS track, without "no info": a document either has a track or not', async () => {
    const { wrapper } = await mountItem('has_track');

    expect(wrapper.find('label').text()).toBe('GPS Track');
    expect(wrapper.find('.multiselect').text()).toBe('yes|no');
  });

  it('keeps "no info" for the fields that can be unknown', async () => {
    const { wrapper } = await mountItem('has_track');
    expect(wrapper.find('.multiselect').text()).not.toContain('no info');

    const nullable = constants.objectDefinitions.route.fields.lift_access;
    const other = mount(QueryItem, {
      props: { field: nullable },
      global: {
        plugins: [
          createRouter({
            history: createMemoryHistory(),
            routes: [{ path: '/:p(.*)*', component: { render: () => h('div') } }],
          }),
        ],
        stubs: { Multiselect },
        config: {
          globalProperties: {
            $gettext: (text: string) => text,
            $filters: { uppercaseFirstLetter: (text: string) => text },
          } as never,
        },
      },
    });
    await flushPromises();
    expect(other.find('.multiselect').text()).toBe('yes|no|no info');
  });
});
