<template>
  <div v-if="onboardingVisible" class="onboarding-overlay" role="dialog" aria-modal="true" :aria-label="current.title">
    <div class="onboarding-card">
      <button type="button" class="onboarding-skip" :aria-label="$gettext('Skip')" @click="finishOnboarding">
        <fa-icon icon="xmark" />
      </button>

      <div class="onboarding-slide">
        <div class="onboarding-icon">
          <fa-icon :icon="current.icon" />
        </div>
        <h2 class="onboarding-title">{{ current.title }}</h2>
        <p v-if="current.text" class="onboarding-text">{{ current.text }}</p>
        <app-install-steps v-if="current.install" class="onboarding-install" />
        <ul v-if="current.list" class="onboarding-list">
          <li v-for="item of current.list" :key="item.icon">
            <fa-icon :icon="item.icon" fixed-width class="onboarding-list-icon" />
            <span>{{ item.text }}</span>
          </li>
        </ul>
        <router-link
          v-if="current.guide"
          :to="{ name: 'app-guide' }"
          class="onboarding-guide"
          @click="finishOnboarding"
        >
          <fa-icon icon="book-open" />
          {{ $gettext('Read the app guide') }}
        </router-link>
      </div>

      <div class="onboarding-dots">
        <button
          v-for="(slide, i) of slides"
          :key="slide.icon"
          type="button"
          class="onboarding-dot"
          :class="{ 'is-active': i === shownStep }"
          :aria-label="$gettext('Step') + ' ' + (i + 1)"
          @click="step = i"
        />
      </div>

      <div class="onboarding-actions">
        <button v-if="shownStep > 0" type="button" class="onboarding-btn onboarding-btn-secondary" @click="step--">
          {{ $gettext('Previous') }}
        </button>
        <button
          v-if="shownStep < slides.length - 1"
          type="button"
          class="onboarding-btn onboarding-btn-primary"
          @click="step++"
        >
          {{ $gettext('Next') }}
        </button>
        <button v-else type="button" class="onboarding-btn onboarding-btn-primary" @click="finishOnboarding">
          {{ $gettext("Let's go") }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// The tour of the first launch, in the middle of the screen. Its second slide asks to add the app to the home screen:
// that is what makes it an app, and on iPhone what keeps the offline data, which Safari clears for a site not on the
// home screen after seven days without a visit. Skipped once installed
import { computed, ref, watch } from 'vue';

import AppInstallSteps from './AppInstallSteps.vue';
import { finishOnboarding, onboardingVisible } from './onboarding';

import { useGlobalProperties } from '@/js/composables/global-properties';
import install from '@/pwa/install';

defineOptions({ name: 'OnboardingTour' });

interface Slide {
  icon: string;
  title: string;
  text?: string;
  install?: boolean;
  list?: { icon: string; text: string }[];
  guide?: boolean;
}

const { $gettext } = useGlobalProperties();

const step = ref(0);
watch(onboardingVisible, (visible) => visible && (step.value = 0));

const slides = computed<Slide[]>(() => [
  {
    icon: 'mountain',
    title: $gettext('Welcome to Camptocamp'),
    text: $gettext('Topos, outings, conditions and stories of the mountains, in your pocket.'),
  },
  ...(install.installed
    ? []
    : [
        {
          icon: 'mobile-screen',
          title: $gettext('Install the app'),
          text: $gettext(
            'Add Camptocamp to your home screen: an icon like an app, the whole screen, and your data kept on the phone. On iPhone, Safari clears the data of a site that is not installed after seven days without a visit.'
          ),
          install: true,
        },
      ]),
  {
    icon: 'list',
    title: $gettext('What the app gives you'),
    list: [
      { icon: 'magnifying-glass', text: $gettext('The topoguide at hand: search, map, filters.') },
      { icon: 'clock', text: $gettext('The Recent feed: the latest outings and their photos.') },
      { icon: 'bookmark', text: $gettext('My topos: take a topo offline, with its photos and its map.') },
      { icon: 'circle-info', text: $gettext('Help and settings in the Me tab.') },
      { icon: 'moon', text: $gettext('Dark theme and larger text: Me → App settings.') },
    ],
  },
  {
    icon: 'book-open',
    title: $gettext('To go further'),
    text: $gettext('Tabs at the bottom of the screen. Everything is explained in the guide. Have a good outing!'),
    guide: true,
  },
]);

// the install slide goes away if the app gets installed meanwhile
const shownStep = computed(() => Math.min(step.value, slides.value.length - 1));
const current = computed(() => slides.value[shownStep.value]);
</script>

<style scoped>
.onboarding-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  /* over the bars of the app (bottom 28, top 26), under the image viewer */
  z-index: 50;
  padding: 1rem;
}

.onboarding-card {
  position: relative;
  width: 100%;
  max-width: 380px;
  background: white;
  border-radius: 12px;
  padding: 1.5rem 1.25rem 1.25rem;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.onboarding-skip {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: transparent;
  border: none;
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  color: #6b6b6b;
  cursor: pointer;
  border-radius: 50%;

  &:hover {
    background: rgba(0, 0, 0, 0.05);
    color: #4a4a4a;
  }
}

.onboarding-slide {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding: 0.5rem 0;
  min-height: 180px;
}

.onboarding-icon {
  width: 64px;
  height: 64px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: #fff5e6;
  color: var(--c2c-color-base-c2c);
  font-size: 1.8rem;
  border-radius: 50%;
}

.onboarding-title {
  font-size: 1.15rem;
  font-weight: 700;
  color: #4a4a4a;
  margin: 0;
}

.onboarding-text {
  font-size: 0.9rem;
  color: #6b6b6b;
  line-height: 1.4;
  margin: 0;
}

.onboarding-install {
  width: 100%;
}

.onboarding-list {
  width: 100%;
  margin: 0;
  padding: 0;
  list-style: none;
  text-align: left;
  font-size: 0.88rem;
  color: #4a4a4a;

  li {
    display: flex;
    gap: 0.6rem;
    align-items: baseline;
    padding: 0.3rem 0;
  }
}

.onboarding-list-icon {
  flex: none;
  color: var(--c2c-color-base-c2c);
}

.onboarding-guide {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 600;
}

.onboarding-dots {
  display: flex;
  justify-content: center;
  gap: 0.4rem;
}

.onboarding-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #d1d5db;
  border: none;
  padding: 0;
  cursor: pointer;
  transition:
    background 0.15s,
    transform 0.15s;

  &.is-active {
    background: var(--c2c-color-base-c2c);
    transform: scale(1.3);
  }
}

.onboarding-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
}

.onboarding-btn {
  padding: 0.55rem 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.onboarding-btn-primary {
  background: var(--c2c-color-base-c2c);
  color: white;

  &:hover {
    background: #e6791f;
  }
}

.onboarding-btn-secondary {
  background: transparent;
  color: #4a4a4a;
  border: 1px solid rgba(0, 0, 0, 0.12);

  &:hover {
    background: rgba(0, 0, 0, 0.04);
  }
}
</style>

<style>
html[data-theme='dark'] {
  .onboarding-card {
    background: #2a2a2a;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.6);
  }
  .onboarding-title {
    color: #f5f5f5;
  }
  .onboarding-text {
    color: #b5b5b5;
  }
  .onboarding-list {
    color: #e5e5e5;
  }
  .onboarding-skip {
    color: #b5b5b5;
    &:hover {
      background: rgba(255, 255, 255, 0.08);
      color: #fff;
    }
  }
  .onboarding-icon {
    background: #3a2f1a;
  }
  .onboarding-btn-secondary {
    color: #e5e5e5;
    border-color: rgba(255, 255, 255, 0.15);
    &:hover {
      background: rgba(255, 255, 255, 0.06);
    }
  }
}
</style>
