import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { h } from 'vue';
import { createMemoryHistory, createRouter } from 'vue-router';

import DfmAdLarge from './DfmAdLarge.vue';
import DfmAdSmall from './DfmAdSmall.vue';

import { adSlotHeight, loadAdScript, watchAdSlot } from '@/js/ad-script';

vi.mock('@/js/ad-script', () => ({ loadAdScript: vi.fn(), adSlotHeight: vi.fn(), watchAdSlot: vi.fn() }));

const mountAt = async (component: typeof DfmAdSmall | typeof DfmAdLarge, path = '/routes/1') => {
  const page = { render: () => h('div') };
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: page },
      { path: '/routes/:id', name: 'route', component: page },
    ],
  });
  await router.push(path);
  return mount(component, { attachTo: document.body, global: { plugins: [router] } });
};

describe.each([
  ['DfmAdSmall', DfmAdSmall, 'camptocamp_htd'],
  ['DfmAdLarge', DfmAdLarge, 'camptocamp_htad'],
])('%s', (_name, component, divId) => {
  beforeEach(() => {
    vi.mocked(loadAdScript).mockReset();
  });

  it('asks for the ad script only once its div is in the page', async () => {
    // importing the component is not enough: the ad script displays its slots as soon as it runs
    expect(loadAdScript).not.toHaveBeenCalled();

    let divInPage = false;
    vi.mocked(loadAdScript).mockImplementation(() => {
      divInPage = document.getElementById(divId) !== null;
    });
    const wrapper = await mountAt(component);

    expect(loadAdScript).toHaveBeenCalledOnce();
    expect(divInPage).toBe(true);
    wrapper.unmount();
  });
});

describe('DfmAdSmall', () => {
  const slot = () => document.getElementById('camptocamp_htd')!;

  beforeEach(() => {
    vi.mocked(adSlotHeight).mockImplementation((homePage) => (homePage ? 250 : 90));
    vi.mocked(watchAdSlot).mockReset();
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('leaves the room of the ad before it comes, as the ad script will choose it', async () => {
    let wrapper = await mountAt(DfmAdSmall, '/');
    expect(slot().style.minHeight).toBe('250px');
    wrapper.unmount();

    wrapper = await mountAt(DfmAdSmall, '/routes/1');
    expect(slot().style.minHeight).toBe('90px');
    wrapper.unmount();
  });

  it('gives the room back while the slot has no ad, and stops watching it once removed', async () => {
    const stopWatching = vi.fn();
    vi.mocked(watchAdSlot).mockReturnValue(stopWatching);
    const wrapper = await mountAt(DfmAdSmall);
    expect(watchAdSlot).toHaveBeenCalledWith('camptocamp_htd', expect.any(Function));
    const onRender = vi.mocked(watchAdSlot).mock.calls[0]![1];

    onRender(false);
    await flushPromises();
    expect(slot().style.minHeight).toBe('');
    expect(wrapper.classes()).toContain('is-empty');

    // a refresh of the slot brings an ad
    onRender(true);
    await flushPromises();
    expect(slot().style.minHeight).toBe('90px');
    expect(wrapper.classes()).not.toContain('is-empty');

    wrapper.unmount();
    expect(stopWatching).toHaveBeenCalledOnce();
  });
});
