// The tour is a modal dialog: the keyboard stays in it while it is open
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { computed, nextTick } from 'vue';

const landing = vi.hoisted(() => ({ onHomePage: true }));
vi.mock('@/js/composables/home-page', () => ({ useIsHomePage: () => computed(() => landing.onHomePage) }));

import OnboardingTour from './OnboardingTour.vue';
import { onboardingVisible } from './onboarding';

const mountTour = () =>
  mount(OnboardingTour, {
    attachTo: document.body,
    global: {
      config: { globalProperties: { $gettext: (text: string) => text } as never },
      stubs: { FaIcon: true, RouterLink: true, AppInstallSteps: true },
    },
  });

describe('OnboardingTour', () => {
  afterEach(() => {
    onboardingVisible.value = false;
    document.body.innerHTML = '';
  });

  it('takes the focus, keeps Tab in it, and gives the focus back once skipped', async () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    onboardingVisible.value = true;
    const wrapper = mountTour();
    await nextTick();
    await nextTick();
    expect(document.activeElement).toBe(wrapper.find('.onboarding-card').element);

    // Shift+Tab from the start goes round to the last button, not out of the dialog
    await wrapper.find('.onboarding-overlay').trigger('keydown', { key: 'Tab', shiftKey: true });
    const buttons = wrapper.findAll('button');
    expect(document.activeElement).toBe(buttons[buttons.length - 1].element);

    await wrapper.find('.onboarding-overlay').trigger('keydown', { key: 'Escape' });
    await nextTick();
    expect(onboardingVisible.value).toBe(false);
    expect(document.activeElement).toBe(opener);
    wrapper.unmount();
  });
});

// a new page load: the tour decides again whether to show, from what is stored
async function launch(onHomePage: boolean) {
  vi.resetModules();
  landing.onHomePage = onHomePage;
  const { default: Tour } = await import('./OnboardingTour.vue');
  const { onboardingVisible: visible } = await import('./onboarding');
  const wrapper = mount(Tour, {
    global: {
      config: { globalProperties: { $gettext: (text: string) => text } as never },
      stubs: { FaIcon: true, RouterLink: true, AppInstallSteps: true },
    },
  });
  return { wrapper, visible };
}

describe('OnboardingTour, shown by itself', () => {
  beforeEach(() => window.localStorage.clear());

  it('shows until finished', async () => {
    const first = await launch(true);
    expect(first.visible.value).toBe(true);
    first.wrapper.unmount();

    const again = await launch(true);
    expect(again.visible.value).toBe(true);
    await again.wrapper.find('.onboarding-skip').trigger('click');
    again.wrapper.unmount();

    const next = await launch(true);
    expect(next.visible.value).toBe(false);
    next.wrapper.unmount();
  });

  it('does not cover a page opened by a link, and shows at a later launch on the home page', async () => {
    const linked = await launch(false);
    expect(linked.visible.value).toBe(false);
    linked.wrapper.unmount();

    const home = await launch(true);
    expect(home.visible.value).toBe(true);
    home.wrapper.unmount();
  });
});
