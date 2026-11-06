// The welcome tour (OnboardingTour.vue): shown once per device, replayed from the app settings
import { ref } from 'vue';

import { getPreferences } from '@/js/vue-plugins/local-storage';

const preferences = getPreferences('Onboarding');

export const onboardingVisible = ref(!preferences.get<boolean>('done', false));

export function finishOnboarding() {
  try {
    preferences.set('done', true);
  } catch {
    // storage blocked: the tour shows again next time, nothing worse
  }
  onboardingVisible.value = false;
}

export function replayOnboarding() {
  onboardingVisible.value = true;
}
