import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import RecentOutingsBox from './RecentOutingsBox.vue';

import service, { type PartnerOuting } from '@/js/apis/partner-outings-service';
import { fromLonLat } from '@/js/geo/projection';
import { c2cOuting, partnerOuting } from '@/views/portals/metaskirando/fixtures';

const config = vi.hoisted(() => ({ isBackendSelectable: false, urls: { name: 'demo' } }));
vi.mock('@/js/config', () => ({ default: config }));

const isDraftView = ref(false);
const isNormalView = ref(true);
vi.mock('@/js/composables/view-mode', () => ({ useViewMode: () => ({ isDraftView, isNormalView }) }));

const SUMMIT = [5.93, 45.11];
const point = ([lon, lat]: number[]) => JSON.stringify({ type: 'Point', coordinates: fromLonLat([lon, lat]) });
// north of the summit, by metres on the ground
const north = (metres: number) => [SUMMIT[0], SUMMIT[1] + metres / 111195];

const c2cRow = { document_id: 9, type: 'o', quality: 'fine', date_end: '2026-01-02', activities: ['skitouring'] };
const waypoint = (outings: object[] = [c2cRow]) => ({
  document_id: 37371,
  type: 'w',
  geometry: { geom: point(SUMMIT) },
  associations: {
    recent_outings: { documents: outings, total: outings.length },
    all_routes: { documents: [], total: 0 },
  },
});
const route = {
  document_id: 46393,
  type: 'r',
  activities: ['skitouring'],
  geometry: { geom: point(north(-3000)), geom_detail: null },
  associations: {
    waypoints: [{ document_id: 37371, geometry: { geom: point(SUMMIT) } }],
    recent_outings: { documents: [], total: 0 },
  },
};

const located = (id: string, lonLat: number[], quality = 'summit_match') =>
  partnerOuting({ id, title: id, geometry: { geom: point(lonLat), quality } });
const answer = (items: PartnerOuting[]) => ({ total: items.length, items, sources: [] });

let getAll: ReturnType<typeof vi.spyOn>;

const mountBox = async (document: object = waypoint()) => {
  const wrapper = mount(RecentOutingsBox, {
    props: { document: document as never },
    global: {
      config: {
        globalProperties: {
          $gettext: (text: string) => text,
          $language: { current: 'en' },
          $documentUtils: {
            getDocumentsBbox: () => null,
            getDocumentType: (type: string) => ({ w: 'waypoint', r: 'route', i: 'image' })[type],
          },
        } as never,
      },
      directives: { translate: {} },
      stubs: {
        RouterLink: RouterLinkStub,
        PrettyOutingLink: { props: ['outing'], template: '<div class="c2c-outing">{{ outing.document_id }}</div>' },
        AddLink: { template: '<a class="add-link"><slot /></a>' },
        Activities: true,
      },
    },
  });
  await flushPromises();
  return wrapper;
};

const partnerTitles = (wrapper: Awaited<ReturnType<typeof mountBox>>) =>
  wrapper.findAll('[data-test="partner-outing"]').map((line) => line.text().replace(/\s+/g, ' '));

describe('RecentOutingsBox, the partner outings', () => {
  beforeEach(() => {
    config.isBackendSelectable = false;
    config.urls.name = 'demo';
    isDraftView.value = false;
    isNormalView.value = true;
    getAll = vi.spyOn(service, 'getAll');
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lists the close partner outings of a waypoint under its c2c outings, from one request', async () => {
    getAll.mockResolvedValue(
      answer([
        located('At the summit', north(5)),
        c2cOuting({ geometry: { geom: point(SUMMIT), quality: 'start' } }),
        located('Below', north(1200), 'start'),
        located('Far', north(5000), 'start'),
      ])
    );
    const wrapper = await mountBox();

    expect(getAll).toHaveBeenCalledTimes(1);
    const [query] = getAll.mock.calls[0] as [Record<string, unknown>];
    expect(query.bbox).toHaveLength(4);
    // a waypoint lists every activity
    expect(query.act).toBeUndefined();
    expect(query.pl).toBe('en');

    // the c2c outings first, as before, then the subtitle and the partner outings
    expect(wrapper.find('.c2c-outing').text()).toBe('9');
    expect(wrapper.find('.partner-outings-title').text()).toBe('nearby, from other sites');
    const titles = partnerTitles(wrapper);
    expect(titles).toHaveLength(2);
    expect(titles[0]).toContain('At the summit');
    expect(titles[1]).toContain('Below');
    expect(wrapper.html().indexOf('c2c-outing')).toBeLessThan(wrapper.html().indexOf('partner-outings-title'));
    // no button for them
    expect(wrapper.findAll('.partner-outings .button')).toHaveLength(0);
  });

  it('shows the box for partner outings alone, and asks those of the activities of a route', async () => {
    getAll.mockResolvedValue(answer([located('On the summit', north(10))]));
    const wrapper = await mountBox(route);

    const [query] = getAll.mock.calls[0] as [Record<string, unknown>];
    expect(query.act).toEqual(['skitouring']);
    expect(partnerTitles(wrapper)[0]).toContain('On the summit');
  });

  it('is the box of before when nothing is close, or when the API fails (404 of an older API)', async () => {
    getAll.mockResolvedValue(answer([located('Far', north(5000))]));
    let wrapper = await mountBox();
    expect(wrapper.find('[data-test="partner-outings"]').exists()).toBe(false);
    expect(wrapper.find('.c2c-outing').exists()).toBe(true);

    getAll.mockRejectedValue(Object.assign(new Error('Not Found'), { response: { status: 404 } }));
    wrapper = await mountBox();
    expect(wrapper.find('[data-test="partner-outings"]').exists()).toBe(false);

    // no c2c outing, no partner outing, no route to add one to: no box
    wrapper = await mountBox(waypoint([]));
    expect(wrapper.find('.box').exists()).toBe(false);
  });

  it('asks nothing for a document without a location, or of another type', async () => {
    await mountBox({ ...waypoint(), geometry: null });
    await mountBox({ ...waypoint(), type: 'i' });
    expect(getAll).not.toHaveBeenCalled();
  });

  it('is not on camptocamp.org yet, as the /metaskirando menu entry, but on a build whose backend can be chosen', async () => {
    getAll.mockResolvedValue(answer([located('At the summit', north(5))]));
    config.urls.name = 'prod';
    expect((await mountBox()).find('[data-test="partner-outings"]').exists()).toBe(false);
    expect(getAll).not.toHaveBeenCalled();

    config.isBackendSelectable = true;
    expect((await mountBox()).find('[data-test="partner-outings"]').exists()).toBe(true);
  });

  it('asks nothing outside of the normal view (edit preview, version, printing)', async () => {
    isNormalView.value = false;
    await mountBox();
    expect(getAll).not.toHaveBeenCalled();
  });
});
