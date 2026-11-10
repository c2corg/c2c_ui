// Small user views: the tracker authorization callback, and the success check AccountView shows after a save
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryHistory, createRouter, type Router } from 'vue-router';

import TrackersExchangeTokenView from './TrackersExchangeTokenView.vue';
import FormSubmitSuccessIndicator from './utils/FormSubmitSuccessIndicator.vue';

const api = vi.hoisted(() => ({ exchangeToken: vi.fn() }));

vi.mock('@/js/apis/tracking-service', () => ({ default: { exchangeToken: api.exchangeToken } }));

const Empty = { render: () => null };

describe('TrackersExchangeTokenView', () => {
  let router: Router;

  beforeEach(async () => {
    vi.clearAllMocks();
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/trackers', name: 'trackers', component: Empty },
        { path: '/trackers/:vendor/exchange-token', name: 'trackers-exchange-token', component: Empty },
      ],
    });
    await router.push('/trackers/strava/exchange-token?code=abc');
  });

  it('exchanges the token of the vendor, then goes back to the trackers', async () => {
    api.exchangeToken.mockResolvedValue({});
    mount(TrackersExchangeTokenView, {
      global: {
        plugins: [router],
        stubs: { SpinnerIcon: true },
        config: { globalProperties: { $user: { id: 42 } } as never },
        directives: { translate: {} },
      },
    });
    await flushPromises();

    expect(api.exchangeToken).toHaveBeenCalledWith('strava', 42, { code: 'abc' });
    expect(router.currentRoute.value.name).toBe('trackers');
  });
});

describe('FormSubmitSuccessIndicator', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('is shown and cleared by its parent through its template ref, and hides after its duration', async () => {
    vi.useFakeTimers();
    // as AccountView does: the indicator's own instance is closed to its parent
    const Parent = {
      components: { FormSubmitSuccessIndicator },
      template: '<form-submit-success-indicator ref="indicator" :duration="1000" />',
    };
    const wrapper = mount(Parent, { global: { stubs: { FaIcon: true, transition: false } } });
    const indicator = wrapper.vm.$refs.indicator as { show(): void; clear(): void };
    const isShown = () => wrapper.find('fa-icon-stub').exists();

    indicator.show();
    await wrapper.vm.$nextTick();
    expect(isShown()).toBe(true);

    vi.advanceTimersByTime(1000);
    await wrapper.vm.$nextTick();
    expect(isShown()).toBe(false);

    indicator.show();
    indicator.clear();
    await wrapper.vm.$nextTick();
    expect(isShown()).toBe(false);
  });
});
