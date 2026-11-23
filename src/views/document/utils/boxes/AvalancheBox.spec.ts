import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import AvalancheBox from './AvalancheBox.vue';

import avalancheBulletins from '@/js/apis/avalanche-bulletin-service';
import yetiService from '@/js/apis/yeti-service';

// a route at Chamonix (EPSG:3857), up to 3000 m, in the Mont-Blanc massif
const route = {
  document_id: 1,
  type: 'r',
  activities: ['skitouring'],
  elevation_max: 3000,
  geometry: { geom: JSON.stringify({ type: 'Point', coordinates: [765000, 5767000] }) },
};
const massif = {
  type: 'Feature',
  properties: { name: 'Mont-Blanc', country: 'France' },
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [6.7, 45.8],
        [7.0, 45.8],
        [7.0, 46.0],
        [6.7, 46.0],
        [6.7, 45.8],
      ],
    ],
  },
};
// the summary of api.ensg.eu: the max of the massif, and the ENSG page that goes away
const summary = {
  id: 'mb',
  name: 'Mont-Blanc',
  zone: 'Mont-Blanc',
  country: 'France',
  urls: [{ url: 'https://metaskirando.ovh/showbra.php?massif=3' }],
  danger: { max: 4 },
  orientations: {},
  validUntil: '',
};
// 2 below 2400 m, 3 above
const bulletin = {
  bulletinID: 'b1',
  regions: [{ regionID: 'FR-03', name: 'Mont-Blanc' }],
  dangerRatings: [
    { mainValue: 'moderate', elevation: { upperBound: '2400' } },
    { mainValue: 'considerable', elevation: { lowerBound: '2400' } },
  ],
};

const mountBox = async (isMobile = false) => {
  const wrapper = mount(AvalancheBox, {
    props: { document: route as never },
    global: {
      config: {
        globalProperties: {
          $gettext: (text: string) => text,
          $language: { current: 'fr' },
          $screen: { isMobile },
        } as never,
      },
      directives: { translate: {} },
      stubs: {
        IconBra: { props: ['level'], template: '<i class="icon-bra-level">{{ level }}</i>' },
        IconYeti: true,
        FaIcon: true,
        RouterLink: { props: ['to'], template: '<a class="router-link" :data-to="JSON.stringify(to)"><slot /></a>' },
        BulletinDetail: {
          props: ['selected', 'bulletins', 'compact'],
          template: '<div class="bulletin-detail" :data-compact="compact">{{ selected.regionId }}</div>',
        },
        ModalCard: { template: '<div class="modal-card-stub"><slot /></div>', methods: { show: vi.fn() } },
      },
    },
  });
  // the zones, then the bulletins once the browser is idle
  await vi.waitFor(() => expect(getLatest).toHaveBeenCalled());
  await flushPromises();
  return wrapper;
};

let getLatest: ReturnType<typeof vi.fn>;

describe('AvalancheBox', () => {
  beforeEach(() => {
    vi.spyOn(yetiService, 'zonesBra').mockResolvedValue({
      data: { type: 'FeatureCollection', features: [massif] },
    } as never);
    vi.spyOn(yetiService, 'bra').mockResolvedValue({ data: { zones: [summary] } } as never);
    getLatest = vi.spyOn(avalancheBulletins, 'getLatestBulletins').mockResolvedValue([bulletin] as never) as never;
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('fetches the bulletins of the regions of the route in the background, and gives the danger at its elevation', async () => {
    const wrapper = await mountBox();

    expect(getLatest).toHaveBeenCalledWith('FR-03', 'fr', expect.any(AbortSignal));
    // 3 at 3000 m, not the max (4) of the summary
    expect(wrapper.find('.icon-bra-level').text()).toBe('3');
    // the official bulletin, not the ENSG page; YETI on its bulletin
    expect(wrapper.find('a[href]').attributes('href')).toMatch(/\/avalanche-bulletins\/regions\/FR-03\/latest\/pdf$/);
    expect(JSON.parse(wrapper.find('.router-link').attributes('data-to')!).query).toEqual({ bulletin: 'FR-03' });

    const signal = getLatest.mock.calls[0][2] as AbortSignal;
    wrapper.unmount();
    expect(signal.aborted).toBe(true);
  });

  it('unfolds on a long hover, not a short one; a click pins it', async () => {
    const wrapper = await mountBox();
    vi.useFakeTimers();
    const box = wrapper.find('.avalanche-box');
    const unfolded = () => wrapper.find('.bulletin-panel').exists();

    await box.trigger('pointerenter', { pointerType: 'mouse' });
    vi.advanceTimersByTime(300);
    await box.trigger('pointerleave');
    vi.advanceTimersByTime(1000);
    await flushPromises();
    expect(unfolded()).toBe(false);

    await box.trigger('pointerenter', { pointerType: 'mouse' });
    vi.advanceTimersByTime(600);
    await flushPromises();
    expect(unfolded()).toBe(true);
    // a digest in the column of a large screen
    expect(wrapper.find('.bulletin-panel .bulletin-detail').attributes('data-compact')).toBe('true');

    // pinned: stays open when the pointer leaves
    await wrapper.find('.bulletin-toggle').trigger('click');
    await box.trigger('pointerleave');
    vi.advanceTimersByTime(1000);
    await flushPromises();
    expect(unfolded()).toBe(true);
    expect(wrapper.find('.bulletin-toggle').attributes('aria-expanded')).toBe('true');

    await wrapper.find('.bulletin-toggle').trigger('click');
    expect(unfolded()).toBe(false);
  });

  it('unfolds the whole bulletin by the button on a phone (no hover)', async () => {
    const wrapper = await mountBox(true);
    await wrapper.find('.avalanche-box').trigger('pointerenter', { pointerType: 'touch' });
    expect(wrapper.find('.bulletin-panel').exists()).toBe(false);

    await wrapper.find('.bulletin-toggle').trigger('click');
    expect(wrapper.find('.bulletin-panel .bulletin-detail').attributes('data-compact')).toBe('false');
  });
});
