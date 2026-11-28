import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ref } from 'vue';

import PartnerOutingsBox from './PartnerOutingsBox.vue';

import service, { type PartnerOuting } from '@/js/apis/partner-outings-service';
import { fromLonLat } from '@/js/geo/projection';
import { c2cOuting, partnerOuting } from '@/views/portals/metaskirando/fixtures';

const config = vi.hoisted(() => ({ isBackendSelectable: false, urls: { name: 'demo' } }));
vi.mock('@/js/config', () => ({ default: config }));

const isDraftView = ref(false);
vi.mock('@/js/composables/view-mode', () => ({ useViewMode: () => ({ isDraftView }) }));

const SUMMIT = [5.93, 45.11];
const point = ([lon, lat]: number[]) => JSON.stringify({ type: 'Point', coordinates: fromLonLat([lon, lat]) });
// north of the summit, by metres on the ground
const north = (metres: number) => [SUMMIT[0], SUMMIT[1] + metres / 111195];

const waypoint = { document_id: 37371, type: 'w', geometry: { geom: point(SUMMIT) }, associations: {} };
const route = {
  document_id: 46393,
  type: 'r',
  activities: ['skitouring'],
  geometry: { geom: point(north(-3000)), geom_detail: null },
  associations: { waypoints: [{ document_id: 37371, geometry: { geom: point(SUMMIT) } }] },
};

const located = (id: string, lonLat: number[], quality = 'summit_match') =>
  partnerOuting({ id, title: id, geometry: { geom: point(lonLat), quality } });

let getAll: ReturnType<typeof vi.spyOn>;

const answer = (items: PartnerOuting[]) => ({ total: items.length, items, sources: [] });

const mountBox = async (document: object = waypoint) => {
  const wrapper = mount(PartnerOutingsBox, {
    props: { document: document as never },
    global: {
      config: {
        globalProperties: { $gettext: (text: string) => text, $language: { current: 'en' } } as never,
      },
      stubs: { RouterLink: RouterLinkStub, FaIcon: true, Activities: true },
    },
  });
  await flushPromises();
  return wrapper;
};

describe('PartnerOutingsBox', () => {
  beforeEach(() => {
    config.isBackendSelectable = false;
    config.urls.name = 'demo';
    isDraftView.value = false;
    getAll = vi.spyOn(service, 'getAll');
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lists the partner outings close to a waypoint, with their date and distance', async () => {
    getAll.mockResolvedValue(
      answer([
        located('At the summit', north(5)),
        c2cOuting({ geometry: { geom: point(SUMMIT), quality: 'start' } }),
        located('Below', north(1200), 'start'),
        located('Far', north(5000), 'start'),
      ])
    );
    const wrapper = await mountBox();

    const [query] = getAll.mock.calls[0] as [Record<string, unknown>];
    expect(query.bbox).toHaveLength(4);
    expect(query.date).toMatch(/^\d{4}-\d\d-\d\d,\d{4}-\d\d-\d\d$/);
    // a waypoint lists every activity
    expect(query.act).toBeUndefined();
    expect(query.pl).toBe('en');

    const rows = wrapper.findAll('.partner-outing-row');
    expect(rows.map((row) => row.find('.outing-title').text())).toEqual(['At the summit', 'Below']);
    expect(rows.map((row) => row.find('[data-test="distance"]').text())).toEqual(['Here', '1.2 km away']);
    expect(rows[0].find('.outing-date').text()).toContain('2026-02-14');
    // the location of a summit resolved by name is approximate
    expect(rows[0].find('[data-test="approximate"]').exists()).toBe(true);
    expect(rows[1].find('[data-test="approximate"]').exists()).toBe(false);
  });

  it('asks the outings of the activities of a route, near its waypoints, and links to /metaskirando', async () => {
    getAll.mockResolvedValue(answer([located('On the summit', north(10))]));
    const wrapper = await mountBox(route);

    const [query] = getAll.mock.calls[0] as [Record<string, unknown>];
    expect(query.act).toEqual(['skitouring']);
    expect(wrapper.find('[data-test="distance"]').text()).toBe('On the route');
    const link = wrapper.findComponent(RouterLinkStub);
    expect(link.props('to')).toEqual({
      name: 'metaskirando',
      query: { bbox: (query.bbox as number[]).join(','), act: 'skitouring' },
    });
  });

  it('shows nothing when no partner outing is close, or when the API fails (404 of an older API)', async () => {
    getAll.mockResolvedValue(answer([located('Far', north(5000))]));
    expect((await mountBox()).find('[data-test="partner-outings-box"]').exists()).toBe(false);

    getAll.mockRejectedValue(Object.assign(new Error('Not Found'), { response: { status: 404 } }));
    expect((await mountBox()).find('[data-test="partner-outings-box"]').exists()).toBe(false);
  });

  it('asks nothing for a document without a location', async () => {
    const wrapper = await mountBox({ document_id: 1, type: 'w', geometry: null, associations: {} });
    expect(getAll).not.toHaveBeenCalled();
    expect(wrapper.find('[data-test="partner-outings-box"]').exists()).toBe(false);
  });

  it('is not on camptocamp.org yet, as the /metaskirando menu entry', async () => {
    config.urls.name = 'prod';
    const wrapper = await mountBox();
    expect(getAll).not.toHaveBeenCalled();
    expect(wrapper.find('[data-test="partner-outings-box"]').exists()).toBe(false);
  });

  it('shows on a production build whose backend can be chosen', async () => {
    config.urls.name = 'prod';
    config.isBackendSelectable = true;
    getAll.mockResolvedValue(answer([located('At the summit', north(5))]));
    expect((await mountBox()).find('[data-test="partner-outings-box"]').exists()).toBe(true);
  });

  it('is not in the preview of an edit', async () => {
    isDraftView.value = true;
    getAll.mockResolvedValue(answer([located('At the summit', north(5))]));
    expect((await mountBox()).find('[data-test="partner-outings-box"]').exists()).toBe(false);
    expect(getAll).not.toHaveBeenCalled();
  });
});
