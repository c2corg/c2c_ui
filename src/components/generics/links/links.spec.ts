import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter } from 'vue-router';

import AddLink from './AddLink.vue';
import EditLink from './EditLink.vue';

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', name: 'home', component: { render: () => null } },
    { path: '/routes/edit/:id/:lang', name: 'route-edit', component: { render: () => null } },
    { path: '/outings/add/:lang', name: 'outing-add', component: { render: () => null } },
  ],
});

const global = {
  plugins: [router],
  config: {
    globalProperties: {
      $language: { current: 'fr' },
      $documentUtils: { getDocumentType: () => 'route', getCreationTitle: () => 'add an outing' },
      $filters: { uppercaseFirstLetter: (text: string) => text },
    } as never,
  },
  directives: { translate: {} },
};

// a link a menu closes itself with, as Navigation does: the click listener is on the component
describe('links', () => {
  it('emits click once when the edit link is clicked', async () => {
    const wrapper = mount(EditLink, { props: { document: { document_id: 12, type: 'r' }, lang: 'fr' }, global });

    expect(wrapper.find('a').attributes('href')).toBe('/routes/edit/12/fr');
    await wrapper.find('a').trigger('click');

    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('calls the click listener of the add link once', async () => {
    const onClick = vi.fn();
    const wrapper = mount(
      {
        components: { AddLink },
        template: '<add-link document-type="outing" @click="onClick" />',
        methods: { onClick },
      },
      { global }
    );

    expect(wrapper.find('a').attributes('href')).toBe('/outings/add/fr');
    await wrapper.find('a').trigger('click');

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
