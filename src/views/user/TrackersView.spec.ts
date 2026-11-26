import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import TrackersView from './TrackersView.vue';

const api = vi.hoisted(() => ({ getStatus: vi.fn(), getActivities: vi.fn() }));

vi.mock('vue-router', () => ({
  useRoute: () => ({ query: {} }),
  useRouter: () => ({ resolve: () => ({ href: '/trackers/strava/exchange-token' }) }),
}));
vi.mock('@/js/apis/tracking-service', () => ({
  default: {
    getStatus: api.getStatus,
    getActivities: api.getActivities,
    deauthorize: vi.fn(),
    requestGarminAuthorizationUrl: vi.fn(),
  },
}));
vi.mock('@/js/trackers-oauth-relay', () => ({
  forgetReturnUrl: vi.fn(),
  oauthStart: () => ({ origin: 'http://localhost', state: 'test-state' }),
  rememberReturnUrl: vi.fn(),
  usesRelay: () => false,
}));

describe('TrackersView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.getStatus.mockResolvedValue({ data: { garmin: 'configured' } });
    api.getActivities.mockResolvedValue({
      data: [
        {
          id: 1,
          userId: 42,
          vendor: 'garmin',
          vendorId: '1',
          date: '2026-11-25T09:00:00Z',
          deviceName: 'Garmin Forerunner 965',
          type: { en: 'Hiking' },
        },
        {
          id: 2,
          userId: 42,
          vendor: 'garmin',
          vendorId: '2',
          date: '2026-11-24T09:00:00Z',
          deviceName: 'Garmin',
          type: { en: 'Hiking' },
        },
      ],
    });
  });

  it('shows device names without the vendor names in the latest activity summary', async () => {
    const wrapper = mount(TrackersView, {
      global: {
        stubs: { ApplicationCard: true, FaIcon: true, HtmlHeader: true, IconHeightDiffUp: true, SpinnerIcon: true },
        directives: { translate: {} },
        config: {
          globalProperties: {
            $gettext: (text: string) => text,
            $user: { id: 42, lang: 'en' },
            $dateUtils: { toTechnicalString: (date: string) => date, durationToTimeString: () => '' },
            $documentUtils: { heightDiffUpWithUnit: () => '', lengthWithUnit: () => '' },
          } as never,
        },
      },
    });
    await flushPromises();

    const heading = wrapper.findAll('h2').find((element) => element.text() === 'Last activities');
    const firstActivity = heading?.element.nextElementSibling;
    const secondActivity = firstActivity?.nextElementSibling;

    expect(firstActivity?.textContent).toContain('Forerunner 965');
    expect(firstActivity?.textContent?.match(/garmin/gi)).toHaveLength(1);
    expect(secondActivity?.textContent?.match(/garmin/gi)).toHaveLength(1);
  });
});
