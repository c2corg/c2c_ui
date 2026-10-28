import { mount } from '@vue/test-utils';
import dayjs from 'dayjs';
import { afterEach, describe, expect, it, vi } from 'vitest';

import DataAvalancheLayer from './DataAvalancheLayer.vue';

afterEach(() => {
  vi.useRealTimers();
});

describe('DataAvalancheLayer dates', () => {
  // the dates of the avalanches are days (YYYY-MM-DD): compared to today, not to the time of today
  it('counts the days since an avalanche from today, whatever the time', () => {
    vi.useFakeTimers({ now: new Date('2026-01-15T22:00:00') });
    const wrapper = mount(DataAvalancheLayer, {
      global: {
        provide: { yetiMap: { map: { addLayer() {}, addOverlay() {}, getView: () => null }, getExtent: () => [] } },
        config: {
          globalProperties: {
            $gettext: (text: string) => text,
            $dateUtils: { toLocalizedString: (date: Date, format: string) => dayjs(date).format(format) },
          } as never,
        },
        stubs: { IconLayer: true },
      },
    });
    // Vue Test Utils reaches the <script setup> bindings
    const { dateValid, differenceDays } = wrapper.vm as unknown as {
      dateValid(date: string, days: number): boolean;
      differenceDays(date: string): number;
    };

    expect(differenceDays('2026-01-14')).toBe(1);
    expect(dateValid('2026-01-13', 2)).toBe(false);
    expect(dateValid('2026-01-14', 2)).toBe(true);
  });
});
