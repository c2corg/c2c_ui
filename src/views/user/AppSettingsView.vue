<template>
  <section class="section app-settings-view">
    <div class="container">
      <!-- plain heading and lede: Bulma's `.title + .subtitle` negative margin pulled them onto each other on iOS -->
      <h1 class="app-settings-heading">{{ $gettext('App settings') }}</h1>
      <p class="app-settings-lede">
        {{ $gettext('Settings of this device, not synchronized with your Camptocamp account.') }}
      </p>

      <h2 class="section-label">{{ $gettext('Theme') }}</h2>
      <div class="option-row">
        <button
          v-for="option of themes"
          :key="option.value"
          type="button"
          class="option-btn"
          :class="{ 'is-active': $appSettings.theme === option.value }"
          @click="$appSettings.setTheme(option.value)"
        >
          <fa-icon :icon="option.icon" />
          <span>{{ option.label }}</span>
        </button>
      </div>
      <p class="note">{{ $gettext('« Auto » follows the setting of your system.') }}</p>

      <h2 class="section-label">{{ $gettext('Text size') }}</h2>
      <div class="option-row">
        <button
          v-for="option of textSizes"
          :key="option.value"
          type="button"
          class="option-btn"
          :class="{ 'is-active': $appSettings.textSize === option.value }"
          @click="$appSettings.setTextSize(option.value)"
        >
          <span :style="{ fontSize: option.demoSize }">Aa</span>
          <span>{{ option.label }}</span>
        </button>
      </div>
      <p class="note">{{ $gettext('The base size of the whole interface.') }}</p>

      <h2 class="section-label">{{ $gettext('Units') }}</h2>
      <div class="option-row">
        <button
          v-for="option of unitSystems"
          :key="option.value"
          type="button"
          class="option-btn"
          :class="{ 'is-active': $appSettings.units === option.value }"
          @click="$appSettings.setUnits(option.value)"
        >
          <span>{{ option.sample }}</span>
          <span>{{ option.label }}</span>
        </button>
      </div>
      <p class="note">{{ $gettext('Elevations and distances of the documents. What you type stays metric.') }}</p>

      <!-- the introduction presents the tabs of the bottom bar: only in the phone layout -->
      <template v-if="$appSettings.isMobileShell">
        <h2 class="section-label">{{ $gettext('Discovery') }}</h2>
        <button type="button" class="button is-light is-fullwidth" @click="replayOnboarding">
          <fa-icon icon="circle-info" />
          <span>&nbsp;{{ $gettext('See the introduction again') }}</span>
        </button>
      </template>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { replayOnboarding as replay } from '@/components/app/onboarding';
import { useGlobalProperties } from '@/js/composables/global-properties';
import type { UnitSystem } from '@/js/units';
import type { TextSize, Theme } from '@/stores/app-settings';

defineOptions({ name: 'AppSettingsView' });

const { $gettext } = useGlobalProperties();
const router = useRouter();

const themes = computed<{ value: Theme; label: string; icon: string }[]>(() => [
  { value: 'auto', label: $gettext('Auto'), icon: 'gear' },
  { value: 'light', label: $gettext('Light'), icon: 'sun' },
  { value: 'dark', label: $gettext('Dark'), icon: 'moon' },
]);

const textSizes = computed<{ value: TextSize; label: string; demoSize: string }[]>(() => [
  { value: 'small', label: $gettext('Small'), demoSize: '0.85rem' },
  { value: 'normal', label: $gettext('Normal'), demoSize: '1rem' },
  { value: 'large', label: $gettext('Large'), demoSize: '1.2rem' },
]);

const unitSystems = computed<{ value: UnitSystem; label: string; sample: string }[]>(() => [
  { value: 'metric', label: $gettext('Metric'), sample: 'm · km' },
  { value: 'imperial', label: $gettext('Imperial'), sample: 'ft · mi' },
]);

// the tour shows over the activity feed: a calmer background than this page
function replayOnboarding() {
  replay();
  void router.push({ name: 'home' });
}
</script>

<style scoped>
/* a column as on a phone, not buttons stretched across a computer screen */
.container {
  max-width: 40rem;
}

.app-settings-heading {
  font-size: 1.15rem;
  font-weight: 700;
  color: #4a4a4a;
  margin: 0 0 0.3rem;
  line-height: 1.25;
}

.app-settings-lede {
  font-size: 0.82rem;
  color: #6b6b6b;
  margin: 0 0 1.25rem;
  line-height: 1.45;
}

.section-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #6b6b6b;
  margin: 1.25rem 0 0.5rem;
}

.option-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}

.option-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  padding: 0.75rem 0.5rem;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.12);
  color: #4a4a4a;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    box-shadow 0.15s,
    border-color 0.15s;

  &:hover,
  &:focus {
    outline: none;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  }

  &.is-active {
    border-color: var(--c2c-color-base-c2c);
    background: #fff5e6;
    color: #4a4a4a;
  }
}

.note {
  margin-top: 0.5rem;
  font-size: 0.75rem;
  color: #6b6b6b;
}
</style>

<style>
html[data-theme='dark'] {
  .app-settings-view .app-settings-heading {
    color: #f5f5f5;
  }
  .app-settings-view .app-settings-lede,
  .app-settings-view .section-label,
  .app-settings-view .note {
    color: #9a9a9a;
  }
  .app-settings-view .option-btn {
    background: #2a2a2a;
    border-color: rgba(255, 255, 255, 0.12);
    color: #e5e5e5;
    &.is-active {
      background: #3a2f1a;
      border-color: #ff9933;
      color: #f5f5f5;
    }
  }
}
</style>
