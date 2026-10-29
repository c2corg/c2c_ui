import { flushPromises, mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import Markdown from './Markdown.vue';

const mountMarkdown = async (content: string) => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { render: () => h('div') } },
      { path: '/routes/:id/:lang?/:title?', name: 'route', component: { render: () => h('div') } },
    ],
  });
  await router.push('/');
  const imageViewer = { push: vi.fn(), show: vi.fn() };

  const wrapper = mount(Markdown, {
    props: { content },
    global: {
      plugins: [router],
      config: { globalProperties: { $imageViewer: imageViewer, $language: { current: 'fr' } } as never },
    },
  });
  return { wrapper, router, imageViewer };
};

describe('Markdown', () => {
  it('links the documents through the router', async () => {
    const { wrapper, router } = await mountMarkdown(
      '<a c2c:role="internal-link" c2c:document-type="routes" c2c:document-id="12" c2c:lang="fr" c2c:slug="arete">Arête</a>'
    );
    const link = wrapper.find('a');

    expect(link.attributes('href')).toBe('/routes/12/fr/arete');
    await link.trigger('click');
    await flushPromises();
    expect(router.currentRoute.value.fullPath).toBe('/routes/12/fr/arete');
  });

  it('gives the embedded images to the image viewer, and opens it on click', async () => {
    const { wrapper, imageViewer } = await mountMarkdown(
      '<figure c2c:role="embedded-figure"><img c2c:role="embedded-image" c2c:document-id="34" c2c:url-proxy="/images/proxy/34" c2c:size="MI" /></figure>'
    );
    const image = { document_id: 34, locales: [{ title: '...' }], available_langs: ['fr'], type: 'i' };

    expect(imageViewer.push).toHaveBeenCalledWith(image);
    expect(wrapper.find('figure').attributes('c2c:size')).toBe('MI');
    await wrapper.find('figure picture img').trigger('click');
    expect(imageViewer.show).toHaveBeenCalledWith(image);
  });

  it('styles the notes, sanitizes the content, and follows its changes', async () => {
    const { wrapper } = await mountMarkdown('<div c2c:role="info">Note</div><script>alert(1)</script>');

    expect(wrapper.find('div[c2c\\:role=info]').classes()).toEqual(['notification', 'is-info']);
    expect(wrapper.find('script').exists()).toBe(false);

    await wrapper.setProps({ content: '<p>Other</p>' });
    expect(wrapper.text()).toBe('Other');
  });
});
