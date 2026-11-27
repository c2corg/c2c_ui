import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import BulletinDetail from './BulletinDetail.vue';

import avalancheBulletins from '@/js/apis/avalanche-bulletin-service';

const bulletin = {
  bulletinID: 'b1',
  regions: [{ regionID: 'FR-03', name: 'Mont-Blanc' }],
  dangerRatings: [{ mainValue: 'moderate' }],
  avalancheProblems: [{ problemType: 'wind_slab', comment: 'Wind slabs on the north faces' }],
  weatherForecast: { comment: 'Sunny' },
};

const mountDetail = (props: Record<string, unknown>) =>
  mount(BulletinDetail, {
    props: { selected: { regionId: 'FR-03', name: '' }, ...props },
    global: {
      config: {
        globalProperties: {
          $gettext: (text: string) => text,
          $language: { current: 'fr' },
          $dateUtils: { toLocalizedString: () => '' },
        } as never,
      },
      directives: { translate: {} },
      stubs: { FaIcon: true, DangerLevel: true, InputOrientation: true, SubPanelTitle: true },
    },
  });

describe('BulletinDetail', () => {
  afterEach(() => vi.restoreAllMocks());

  it('shows the bulletins it is given without fetching them, and names a region given alone by its bulletin', async () => {
    const fetch = vi.spyOn(avalancheBulletins, 'getLatestBulletins');
    const wrapper = mountDetail({ bulletins: [bulletin] });
    await flushPromises();

    expect(fetch).not.toHaveBeenCalled();
    expect(wrapper.find('.title').text()).toBe('Mont-Blanc');
    expect(wrapper.text()).toContain('Sunny');
  });

  it('is a digest in a narrow column: the rest on demand', async () => {
    const wrapper = mountDetail({ bulletins: [bulletin], embedded: true, compact: true });

    expect(wrapper.find('.title').exists()).toBe(false);
    expect(wrapper.text()).toContain('Wind slab');
    expect(wrapper.text()).not.toContain('Wind slabs on the north faces');
    expect(wrapper.text()).not.toContain('Sunny');
    await wrapper.find('button').trigger('click');
    expect(wrapper.emitted('more')).toHaveLength(1);
  });

  it('waits for the bulletins being fetched, and says when they failed', () => {
    expect(mountDetail({ bulletins: null }).text()).toContain('Loading the bulletin');
    expect(mountDetail({ bulletins: null, failed: true }).text()).toContain('The bulletin could not be loaded');
  });

  it('flags an expired bulletin, not the one of a past day', () => {
    const old = { ...bulletin, validTime: { endTime: '2020-01-02T16:00:00Z' } };
    expect(mountDetail({ bulletins: [old] }).text()).toContain('Validity date expired');
    expect(mountDetail({ bulletins: [old], historical: true }).text()).not.toContain('Validity date expired');
  });
});
