// Settings of the app on this device (theme, text size, units), not synchronized with the account, and its layout:
// written as data-theme, data-text-size and data-shell on <html>, which the styles of App.vue follow
import { defineStore } from 'pinia';
import { computed, reactive } from 'vue';

import { UNIT_SYSTEMS, type UnitSystem } from '@/js/units';
import { getPreferences } from '@/js/vue-plugins/local-storage';

const THEMES = ['auto', 'light', 'dark'] as const;
const TEXT_SIZES = ['small', 'normal', 'large'] as const;

export type Theme = (typeof THEMES)[number];
export type TextSize = (typeof TEXT_SIZES)[number];

// The layout follows the width, there is no setting: under Bulma's desktop breakpoint (phones, tablets, a narrow
// window), the top bar and the bottom tab bar of the app; from it, the side menu and the navigation of the site
const DESKTOP_QUERY = '(min-width: 1024px)';
const DARK_QUERY = '(prefers-color-scheme: dark)';

function oneOf<T extends string>(allowed: readonly T[], value: unknown, fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

export const useAppSettingsStore = defineStore('app-settings', () => {
  const preferences = getPreferences('AppSettings');

  const state = reactive({
    theme: oneOf(THEMES, preferences.get('theme'), 'auto'),
    textSize: oneOf(TEXT_SIZES, preferences.get('textSize'), 'normal'),
    // what the documents show (src/js/units.ts): read by the views, nothing to write on <html>
    units: oneOf(UNIT_SYSTEMS, preferences.get('units'), 'metric'),
  });

  // what the system and the screen say: the theme follows the system when its setting is 'auto'. Without matchMedia
  // (very old browsers, some test environments) nothing matches
  const system = reactive({ dark: false, desktop: false });
  const follow = (query: string, key: keyof typeof system) => {
    const list = window.matchMedia?.(query);
    system[key] = list?.matches ?? false;
    list?.addEventListener('change', (event) => {
      system[key] = event.matches;
      apply();
    });
  };
  follow(DARK_QUERY, 'dark');
  follow(DESKTOP_QUERY, 'desktop');

  const effectiveTheme = computed<'light' | 'dark'>(() =>
    state.theme === 'auto' ? (system.dark ? 'dark' : 'light') : state.theme
  );
  const effectiveShellMode = computed<'mobile' | 'desktop'>(() => (system.desktop ? 'desktop' : 'mobile'));

  function apply() {
    const root = document.documentElement;
    // in both layouts: the dark rules of App.vue and of the components cover the pages of the site and of the app
    const theme = effectiveTheme.value;
    root.setAttribute('data-theme', theme);
    // native controls (scrollbars, pickers) follow the theme
    root.style.colorScheme = theme;
    root.setAttribute('data-text-size', state.textSize);
    root.setAttribute('data-shell', effectiveShellMode.value);
  }

  apply();

  function set<K extends keyof typeof state>(key: K, value: (typeof state)[K]) {
    state[key] = value;
    preferences.set(key, value);
    apply();
  }

  return {
    // computed, not getters: Pinia copies a getter's value once, which would freeze it
    theme: computed(() => state.theme),
    textSize: computed(() => state.textSize),
    units: computed(() => state.units),
    effectiveTheme,
    effectiveShellMode,
    isMobileShell: computed(() => effectiveShellMode.value === 'mobile'),
    setTheme: (theme: Theme) => set('theme', oneOf(THEMES, theme, state.theme)),
    setTextSize: (textSize: TextSize) => set('textSize', oneOf(TEXT_SIZES, textSize, state.textSize)),
    setUnits: (units: UnitSystem) => set('units', oneOf(UNIT_SYSTEMS, units, state.units)),
  };
});

export type AppSettings = ReturnType<typeof useAppSettingsStore>;
