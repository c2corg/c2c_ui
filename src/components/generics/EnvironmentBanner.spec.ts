import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.resetModules();
  vi.doUnmock('@/js/environment-label');
});

async function mountBanner(label: string) {
  vi.doMock('@/js/environment-label', () => ({ environmentLabel: label }));
  const { default: EnvironmentBanner } = await import('./EnvironmentBanner.vue');
  return mount(EnvironmentBanner, { global: { directives: { translate: {} } } });
}

describe('EnvironmentBanner', () => {
  it('names the environment when there is one', async () => {
    const wrapper = await mountBanner('preprod');
    expect(wrapper.find('.environment-banner').text()).toContain('preprod');
  });

  it('renders nothing in production', async () => {
    const wrapper = await mountBanner('');
    expect(wrapper.find('.environment-banner').exists()).toBe(false);
  });
});
