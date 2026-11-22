<template>
  <section class="section settings-view">
    <html-header :title="$gettext('Settings')" />
    <div class="container">
      <h1 class="title is-3">{{ $gettext('Settings') }}</h1>

      <!-- the language first: the one setting every visitor looks for; kept in the account when logged in -->
      <h2 class="title is-5">{{ $gettext('Language') }}</h2>
      <div class="buttons">
        <button
          v-for="(language, key) of $language.availableUI"
          :key="key"
          :class="{ 'is-primary': $language.current === key }"
          :aria-pressed="$language.current === key"
          type="button"
          class="button"
          @click="$language.setCurrent(key)"
        >
          {{ language }}
        </button>
      </div>
      <p class="note">
        {{
          $user.isLogged
            ? $gettext('Saved in your account: you find it on all your devices.')
            : $gettext('Saved on this device. Logged in, it is saved in your account.')
        }}
      </p>

      <!-- the settings of the device: not synchronized with the account -->
      <section id="device" class="settings-section">
        <h2 class="title is-5">{{ $gettext('This device') }}</h2>
        <p class="lede">{{ $gettext('Settings of this device, not synchronized with your Camptocamp account.') }}</p>

        <h3 class="section-label">{{ $gettext('Theme') }}</h3>
        <div class="option-row">
          <button
            v-for="option of themes"
            :key="option.value"
            type="button"
            class="option-btn"
            :class="{ 'is-active': appSettings.theme === option.value }"
            :aria-pressed="appSettings.theme === option.value"
            @click="appSettings.setTheme(option.value)"
          >
            <fa-icon :icon="option.icon" />
            <span>{{ option.label }}</span>
          </button>
        </div>
        <p class="note">{{ $gettext('« Auto » follows the setting of your system.') }}</p>

        <h3 class="section-label">{{ $gettext('Text size') }}</h3>
        <div class="option-row">
          <button
            v-for="option of textSizes"
            :key="option.value"
            type="button"
            class="option-btn"
            :class="{ 'is-active': appSettings.textSize === option.value }"
            :aria-pressed="appSettings.textSize === option.value"
            @click="appSettings.setTextSize(option.value)"
          >
            <span :style="{ fontSize: option.demoSize }">Aa</span>
            <span>{{ option.label }}</span>
          </button>
        </div>
        <p class="note">{{ $gettext('The base size of the whole interface.') }}</p>

        <!-- the introduction presents the tabs of the bottom bar: only in the phone layout -->
        <template v-if="appSettings.isMobileShell">
          <h3 class="section-label">{{ $gettext('Discovery') }}</h3>
          <button type="button" class="button is-light is-fullwidth" @click="replayOnboarding">
            <fa-icon icon="circle-info" />
            <span>&nbsp;{{ $gettext('See the introduction again') }}</span>
          </button>
        </template>
      </section>

      <!-- the preferences of the account: the feed of the home page, and the "My preferences" button of the lists -->
      <section id="account" class="settings-section">
        <h2 class="title is-5">{{ $gettext('My activities and areas') }}</h2>

        <div class="uses">
          <p class="uses-title">{{ $gettext('What they are used for') }}</p>
          <ul>
            <li>{{ $gettext('Home page: its feed shows the news of these activities, in these areas.') }}</li>
            <li>
              {{
                $gettext(
                  'Lists of routes, outings, waypoints…: their “My preferences” button applies them as filters, in one click.'
                )
              }}
            </li>
            <li>{{ $gettext('Nothing else: they hide nothing elsewhere on the site.') }}</li>
          </ul>
        </div>

        <template v-if="!$user.isLogged">
          <p>{{ $gettext('They are saved in your account: log in to choose them.') }}</p>
          <div class="buttons">
            <router-link :to="{ name: 'auth', query: { redirect: $route.fullPath } }" class="button is-primary">
              {{ $gettext('Login') }}
            </router-link>
            <router-link :to="{ name: 'auth', query: { signup: null, redirect: $route.fullPath } }" class="button">
              {{ $gettext('Create an account') }}
            </router-link>
          </div>
        </template>

        <template v-else>
          <loading-notification :promise="promise" />
          <template v-if="preferences">
            <h3 class="section-label">{{ $gettext('activities') }}</h3>
            <!-- not a grouped field: its icons must wrap on a phone, else the page gets wider than the screen -->
            <div class="field">
              <input-activity v-model="preferences.activities" @update:model-value="save" />
            </div>

            <h3 class="section-label">{{ $gettext('areas') }}</h3>
            <div class="columns is-multiline">
              <div class="column is-narrow">
                <input-document document-type="area" @update:model-value="addArea" />
              </div>
              <div class="column">
                <div class="columns is-multiline">
                  <div v-for="document in preferences.areas" :key="document.document_id" class="column is-4">
                    <document-card :document="document" show-delete-button @delete="removeArea(document)" />
                  </div>
                </div>
              </div>
            </div>

            <h2 class="title is-5 feed-title">{{ $gettext('Home page feed') }}</h2>
            <div class="field">
              <input-checkbox v-model="preferences.followed_only" @change="save">
                <span>{{ $gettext('Show only updates from followed users in the homepage feed') }}</span>
              </input-checkbox>
            </div>
            <p class="note">
              {{
                preferences.followed_only
                  ? $gettext(
                      'The feed then ignores the activities, areas and languages: they still serve the “My preferences” button of the lists.'
                    )
                  : $gettext('Status updates from followed users are always shown.')
              }}
            </p>

            <!-- the languages only filter the feed: not used when it shows only the followed users -->
            <template v-if="!preferences.followed_only">
              <h3 class="section-label">{{ $gettext('Languages of the feed') }}</h3>
              <div class="buttons">
                <button
                  v-for="(language, key) of $language.availableUI"
                  :key="key"
                  :class="{ 'is-primary': preferences.langs.includes(key) }"
                  :aria-pressed="preferences.langs.includes(key)"
                  type="button"
                  class="button"
                  @click="toggle(key, preferences.langs)"
                >
                  {{ language }}
                </button>
              </div>
            </template>
          </template>
        </template>
      </section>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';

import { replayOnboarding as replay } from '@/components/app/onboarding';
import c2c from '@/js/apis/c2c';
import { useGlobalProperties } from '@/js/composables/global-properties';
import { useNoRobots } from '@/js/composables/head';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';
import { type TextSize, type Theme, useAppSettingsStore } from '@/stores/app-settings';

defineOptions({ name: 'SettingsView' });

useNoRobots();

const { $gettext, $user } = useGlobalProperties();
const appSettings = useAppSettingsStore();
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

// the tour shows over the activity feed: a calmer background than this page
function replayOnboarding() {
  replay();
  void router.push({ name: 'home' });
}

// what the user follows in the feed, and what the lists apply with their "My preferences" button
type Preferences = { followed_only: boolean; langs: string[]; activities: string[]; areas: C2cDocument[] };

// logged out: nothing to read, the account part asks to log in
const promise = $user.isLogged ? c2c.userProfile.preferences.get() : null;

const preferences = computed(() => promise?.data as Preferences | undefined);

function toggle(item: string, array: string[]) {
  if (array.includes(item)) {
    array.splice(array.indexOf(item), 1);
  } else {
    array.push(item);
  }
  save();
}

function addArea(area: C2cDocument) {
  preferences.value!.areas.push(area);
  save();
}

function removeArea(area: C2cDocument) {
  preferences.value!.areas = preferences.value!.areas.filter((doc) => doc.document_id !== area.document_id);
  save();
}

function save() {
  c2c.userProfile.preferences.post(preferences.value!);
}
</script>

<style scoped>
/* the width of the former preferences page: room for the cards of the areas */
.container {
  max-width: 52rem;
}

.settings-section {
  margin-top: 2.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--app-border);
}

.lede {
  font-size: 0.85rem;
  color: var(--app-text-muted);
  margin: -0.75rem 0 0.5rem;
}

.section-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--app-text-muted);
  margin: 1.25rem 0 0.5rem;
}

.feed-title {
  margin-top: 2rem;
}

/* the theme and text size choices of the former app settings page: three tiles, not stretched too wide */
.option-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
  max-width: 28rem;
}

.option-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.3rem;
  padding: 0.75rem 0.5rem;
  /* the cards of the site (CardContainer.vue, Bulma's card) */
  background: var(--app-surface);
  border: var(--c2c-card-border);
  border-radius: var(--c2c-radius);
  box-shadow: 0 2px 3px rgba(4%, 4%, 4%, 0.1);
  color: var(--c2c-color-text);
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition:
    box-shadow 0.15s,
    background-color 0.15s;

  &:hover,
  &:focus-visible {
    outline: none;
    box-shadow: var(--c2c-card-hover-shadow);
  }

  /* chosen: the blue of the chosen buttons of the page (the languages) */
  &.is-active {
    border-color: var(--c2c-primary);
    background: var(--c2c-primary);
    color: var(--c2c-white);
  }
}

.note {
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: var(--app-text-muted);
}

/* what the activities and areas do: they filter nothing else, which was not said anywhere */
.uses {
  background: var(--app-accent-background);
  border: 1px solid var(--app-border);
  border-radius: 6px;
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  font-size: 0.9rem;

  ul {
    list-style: disc;
    margin-left: 1.25rem;
  }

  li + li {
    margin-top: 0.25rem;
  }
}

.uses-title {
  font-weight: 600;
  margin-bottom: 0.25rem;
}
</style>
