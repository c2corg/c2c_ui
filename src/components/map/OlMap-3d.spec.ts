import { flushPromises } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

import { mountMap } from './test-utils';

import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';

// the 3D view itself needs WebGL: only what the 2D map gives it is checked here
vi.mock('./Map3dView.vue', () => ({ __esModule: true, default: { render: () => null } }));
vi.mock('./map-3d-support', () => ({ supports3d: () => true, markUnsupported: () => {} }));
// the specs don't load Font Awesome: plain icons
vi.mock('@/components/map/map-utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/components/map/map-utils')>()),
  getDocumentPointStyle: () => [],
  getDocumentIcon: () => ({ svgSrc: '', color: '#F93' }),
}));

const point = (x: number, y: number) => JSON.stringify({ type: 'Point', coordinates: [x, y] });

const outing = {
  document_id: 1,
  type: 'o',
  activities: ['hiking'],
  locales: [{ lang: 'fr', title: 'Sortie' }],
  geometry: {
    geom: point(700000, 5700000),
    geom_detail: JSON.stringify({
      type: 'LineString',
      coordinates: [
        [700000, 5700000],
        [701000, 5701000],
      ],
    }),
  },
  associations: { routes: [{ document_id: 7 }] },
};

const waypoint = (id: number, type: string, x: number) => ({
  document_id: id,
  type: 'w',
  waypoint_type: type,
  locales: [{ lang: 'fr', title: 'W' + id }],
  geometry: { geom: point(x, 5700500) },
});

describe('the 3D view of an outing', () => {
  it('also shows the waypoints of its routes, read when it opens', async () => {
    const get = vi.spyOn(c2c.route as DocumentService, 'get').mockReturnValue(
      Promise.resolve({
        data: {
          associations: {
            waypoints: [waypoint(11, 'summit', 700500), waypoint(12, 'access', 700100), waypoint(13, 'virtual', 0)],
          },
        },
      }) as never
    );
    const { wrapper } = await mountMap({ documents: [outing], show3d: true });
    const vm = wrapper.vm as unknown as {
      open3d(): void;
      map3d: { markers: { lonLat: [number, number]; to: { params: { id: number } } }[] } | null;
    };

    vm.open3d();
    expect(vm.map3d!.markers).toHaveLength(0);
    await flushPromises();

    expect(get).toHaveBeenCalledWith(7, 'fr');
    // the virtual waypoint is left out, as on the 2D map
    expect(vm.map3d!.markers.map((marker) => marker.to.params.id)).toEqual([11, 12]);
    expect(vm.map3d!.markers[0].lonLat[0]).toBeCloseTo(6.288, 2);
    wrapper.unmount();
  });

  it('keeps the view as it is when the route cannot be read', async () => {
    vi.spyOn(c2c.route as DocumentService, 'get').mockReturnValue(Promise.reject(new Error('offline')) as never);
    const { wrapper } = await mountMap({ documents: [outing], show3d: true });
    const vm = wrapper.vm as unknown as { open3d(): void; map3d: { markers: unknown[] } | null };

    vm.open3d();
    await flushPromises();

    expect(vm.map3d!.markers).toHaveLength(0);
    wrapper.unmount();
  });
});

describe('the 3D view of a waypoint', () => {
  it('shows the waypoint itself among its child waypoints', async () => {
    const summit = {
      ...waypoint(20, 'summit', 700000),
      associations: { waypoint_children: [waypoint(21, 'hut', 700300)] },
    };
    const { wrapper } = await mountMap({ documents: [summit], show3d: true });
    const vm = wrapper.vm as unknown as { open3d(): void; map3d: { markers: { to: unknown }[] } | null };

    vm.open3d();

    expect(vm.map3d!.markers).toHaveLength(2);
    // the page's own waypoint is not a link to itself
    expect(vm.map3d!.markers[0].to).toBeNull();
    expect(vm.map3d!.markers[1].to).toEqual({ name: 'waypoint', params: { id: 21 } });
    wrapper.unmount();
  });
});
