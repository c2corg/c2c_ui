// The welcome tour (OnboardingTour.vue): shown by itself once per device, replayed from the app settings
import { ref } from 'vue';

import { getPreferences } from '@/js/vue-plugins/local-storage';

const preferences = getPreferences('Onboarding');

export const onboardingVisible = ref(false);

// decided once per page load, at the first page
let offered = false;

// Shown by itself only at a launch on the home page: a link to a topo (search engine, forum, shared link) opens on the
// topo, not behind the tour
export function offerOnboarding(onHomePage: boolean) {
  if (offered) {
    return;
  }
  offered = true;
  if (onHomePage && !preferences.get<boolean>('done', false)) {
    onboardingVisible.value = true;
  }
}

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
