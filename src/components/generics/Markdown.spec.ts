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

  it('keeps the space of an embedded image while it loads, from the size of its original', async () => {
    const image = (size: string, width?: number, height?: number) =>
      `<figure c2c:role="embedded-figure"><img c2c:role="embedded-image" c2c:document-id="34" c2c:url-proxy="/images/proxy/34" c2c:size="${size}"` +
      (width ? ` c2c:width="${width}" c2c:height="${height}"` : '') +
      ' /></figure>';
    const { wrapper } = await mountMarkdown(
      [
        image('BI', 4000, 3000),
        image('MI', 4000, 3000),
        image('MI', 3000, 4000),
        image('SI', 4000, 3000),
        image('', 800, 600),
        image('MI'),
      ].join('')
    );
    const imgs = wrapper.findAll('img').map((img) => img.element as HTMLImageElement);

    // BI: the thumbnail's size, the CSS keeps the ratio
    expect([imgs[0].width, imgs[0].height]).toEqual([1500, 1125]);
    // MI: bounded by min(400px, 25vw) on its longer side
    expect([imgs[1].width, imgs[1].height]).toEqual([400, 300]);
    expect(imgs[1].style.width).toBe('min(400px, 400px, 25vw)');
    expect(imgs[1].style.aspectRatio).toBe('400 / 300');
    expect(imgs[2].style.height).toBe('min(400px, 400px, 25vw)');
    expect(imgs[2].style.width).toBe('auto');
    // SI: cropped square; no size: the original
    expect([imgs[3].width, imgs[3].height]).toEqual([200, 200]);
    expect([imgs[4].width, imgs[4].height]).toEqual([800, 600]);
    expect(imgs.slice(0, 5).every((img) => !img.classList.contains('is-loading'))).toBe(true);
    // unknown size (an older API): the placeholder size as before
    expect(imgs[5].classList.contains('is-loading')).toBe(true);
    expect(imgs[5].getAttribute('width')).toBe(null);
  });

  it('styles the notes, sanitizes the content, and follows its changes', async () => {
    const { wrapper } = await mountMarkdown('<div c2c:role="info">Note</div><script>alert(1)</script>');

    expect(wrapper.find('div[c2c\\:role=info]').classes()).toEqual(['notification', 'is-info']);
    expect(wrapper.find('script').exists()).toBe(false);

    await wrapper.setProps({ content: '<p>Other</p>' });
    expect(wrapper.text()).toBe('Other');
  });
});
