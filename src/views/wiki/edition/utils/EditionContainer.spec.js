import { createLocalVue, shallowMount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import EditionContainer from './EditionContainer';

import c2c from '@/js/apis/c2c';

vi.mock('@/js/apis/c2c', () => ({ default: { article: { getCooked: vi.fn() } } }));

const localVue = createLocalVue();
localVue.directive('translate', {});

const mountEditionContainer = () =>
  shallowMount(EditionContainer, {
    localVue,
    propsData: { document: { type: 'w', locales: [{ lang: 'fr' }] }, mode: 'edit', isLoading: false },
    slots: { default: '<form class="edit-form" />' },
    mocks: {
      $documentUtils: { getDocumentType: () => 'waypoint' },
      $language: { current: 'fr', availableAPI: {} },
      $route: { params: { lang: 'fr' } },
      $gettext: (msg) => msg,
    },
  });

// let pending promises settle, and node report unhandled rejections
const flush = () => new Promise((resolve) => setTimeout(resolve));

describe('EditionContainer', () => {
  const onUnhandledRejection = vi.fn();

  beforeEach(() => {
    onUnhandledRejection.mockClear();
    c2c.article.getCooked.mockReset();
    process.on('unhandledRejection', onUnhandledRejection);
  });

  afterEach(() => {
    process.off('unhandledRejection', onUnhandledRejection);
  });

  it('shows the edit form without banners, and throws nothing, when banners request fails', async () => {
    c2c.article.getCooked.mockRejectedValue(new Error('Request failed with status code 404'));

    const wrapper = mountEditionContainer();
    await flush();

    expect(onUnhandledRejection).not.toHaveBeenCalled();
    expect(wrapper.find('.edit-form').exists()).toBe(true);
    expect(wrapper.find('.edition-banner').exists()).toBe(false);
  });

  it('requests banners again on next edit view after a failure, shows them at once, then caches them', async () => {
    c2c.article.getCooked.mockResolvedValue({
      data: { cooked: { description: '<h3 id="waypoint">Waypoints</h3><p>Waypoint banner</p>' } },
    });

    const wrapper = mountEditionContainer();
    await flush();

    expect(c2c.article.getCooked).toHaveBeenCalledExactlyOnceWith(1110927, 'fr');
    expect(wrapper.find('.edition-banner').text()).toBe('Waypoint banner');

    const nextWrapper = mountEditionContainer();
    await flush();

    expect(c2c.article.getCooked).toHaveBeenCalledOnce();
    expect(nextWrapper.find('.edition-banner').text()).toBe('Waypoint banner');
  });
});
