// The tour is a modal dialog: the keyboard stays in it while it is open
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { nextTick } from 'vue';

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
