import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { h } from 'vue';

import GdprBanner from './GdprBanner';

import bus from '@/js/event-bus';

const show = vi.fn();

const mountBanner = () =>
  mount(GdprBanner, {
    global: {
      stubs: { GdprModal: { methods: { show }, render: () => h('div') } },
      mocks: { $gdpr: { get: () => null, setAll: vi.fn() } },
      directives: { translate: {} },
    },
  });

describe('GdprBanner', () => {
  afterEach(() => {
    show.mockClear();
    bus.all.clear();
  });

  it('opens the modal on show-gdpr (side menu link)', () => {
    mountBanner();

    bus.emit('show-gdpr');

    expect(show).toHaveBeenCalledTimes(1);
  });

  it('stops listening once destroyed', () => {
    const first = mountBanner();
    first.unmount();
    mountBanner();

    bus.emit('show-gdpr');

    // with $root.$on, the destroyed banner kept its handler: the modal was asked to open twice
    expect(show).toHaveBeenCalledTimes(1);
  });
});
