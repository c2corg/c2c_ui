import { flushPromises, shallowMount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import MapInputRow from './MapInputRow.vue';

import trackingService from '@/js/apis/tracking-service';

const mountRow = async (status: () => Promise<unknown>, geomDetailEditable = true) => {
  vi.spyOn(trackingService, 'getStatus').mockImplementation(status as never);
  const wrapper = shallowMount(MapInputRow, {
    props: { document: { geometry: { geom: null, geom_detail: null } } as never, geomDetailEditable },
    global: {
      directives: { translate: {} },
      config: { globalProperties: { $gettext: (text: string) => text, $user: { id: 42 } } as never },
    },
  });
  await flushPromises();
  return wrapper;
};
const invite = (wrapper: Awaited<ReturnType<typeof mountRow>>) =>
  wrapper.findComponent({ name: 'TrackingInvite' }).exists();

describe('MapInputRow', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('invites the users uploading GPS files without a linked account to link one', async () => {
    const wrapper = await mountRow(() => Promise.resolve({ data: { strava: 'not-configured' } }));

    expect(trackingService.getStatus).toHaveBeenCalledWith(42);
    expect(wrapper.findComponent({ name: 'GpsFileUpload' }).exists()).toBe(true);
    expect(invite(wrapper)).toBe(true);
  });

  it('does not invite the users with a linked account, a lost token too', async () => {
    const linked = await mountRow(() => Promise.resolve({ data: { strava: 'configured' } }));
    expect(linked.findComponent({ name: 'GpsUploadModal' }).exists()).toBe(true);
    expect(invite(linked)).toBe(false);

    const lost = await mountRow(() => Promise.resolve({ data: { garmin: 'token-lost' } }));
    expect(invite(lost)).toBe(false);
  });

  it('invites nobody when the tracking service does not answer, or when there is no track to upload', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(invite(await mountRow(() => Promise.reject(new Error('down'))))).toBe(false);
    expect(invite(await mountRow(() => Promise.resolve({ data: { strava: 'not-configured' } }), false))).toBe(false);
  });
});
