<template>
  <button
    v-if="$user.isLogged && display === 'button'"
    type="button"
    class="button"
    :class="{ 'is-primary': applied, 'is-loading': loading }"
    :title="
      applied ? $gettext('Remove the filters of my preferences') : $gettext('Filter with my activities and areas')
    "
    :aria-pressed="applied"
    @click="togglePreferences"
  >
    <fa-icon :icon="applied ? 'check' : 'star'" />
    <span>&nbsp;</span>
    <span v-translate>My preferences</span>
  </button>
  <a
    v-else-if="$user.isLogged && display === 'dropdown'"
    class="dropdown-item"
    :class="{ 'is-active': applied }"
    @click="togglePreferences"
  >
    <fa-icon :icon="loading ? 'spinner' : applied ? 'check' : 'star'" :spin="loading" />
    <span>&nbsp;</span>
    <span v-translate>My preferences</span>
  </a>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter, type LocationQueryRaw } from 'vue-router';

import c2c from '@/js/apis/c2c';
import { useGlobalProperties } from '@/js/composables/global-properties';
import { toast } from '@/js/toast';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

type UserPreferences = { activities: string[]; areas: C2cDocument[] };

// the list types filtered by activity, and by area
const ACTIVITY_TYPES = ['outing', 'route', 'image', 'xreport', 'book', 'article'];
const AREA_TYPES = ['outing', 'route', 'image', 'xreport', 'waypoint'];

withDefaults(defineProps<{ display?: 'button' | 'dropdown' }>(), { display: 'button' });

const { $gettext } = useGlobalProperties();
const route = useRoute();
const router = useRouter();

const loading = ref(false);
// read at the first click, then known for this list: the button shows when they are applied
const preferences = ref<UserPreferences>();
// the filters of the list before the preferences replaced them, given back when they are removed
let previousFilters: LocationQueryRaw | undefined;

// the parameters the preferences set or remove
const PREFERENCE_PARAMS = ['act', 'a', 'bbox', 'nmr'];

const documentType = computed(() => String(route.name).slice(0, -1));

// the filters the preferences give to this list: undefined removes a parameter from the url
function filtersOf({ activities, areas }: UserPreferences): Record<string, string | undefined> {
  const filters: Record<string, string | undefined> = {};
  if (ACTIVITY_TYPES.includes(documentType.value)) {
    filters.act = activities.join(',') || undefined;
  }
  if (AREA_TYPES.includes(documentType.value)) {
    filters.a = areas.map((area) => area.document_id).join(',') || undefined;
  }
  return filters;
}

const isEmpty = ({ activities, areas }: UserPreferences) => !activities.length && !areas.length;

// the list already shows the preferences: nothing would change
const applied = computed(() => {
  if (!preferences.value || isEmpty(preferences.value)) return false;
  const filters = filtersOf(preferences.value);
  // the areas replace the map extent and the "near me" radius: still there, the list is narrower than the preferences
  if (filters.a !== undefined && (route.query.bbox || route.query.nmr)) return false;
  return Object.entries(filters).every(([key, value]) => (route.query[key] ?? undefined) === value);
});

function notifyWithPreferencesLink(text: string) {
  const message = document.createElement('div');
  message.append(text, ' ');
  const link = document.createElement('a');
  link.href = router.resolve({ name: 'settings', hash: '#account' }).href;
  link.textContent = $gettext('My preferences');
  message.append(link);
  toast({ message, type: 'is-info', duration: 6000 });
}

// a toggle: applies the preferences, or removes them when the list already shows them
async function togglePreferences() {
  if (loading.value) return;
  loading.value = true;
  let loaded: UserPreferences;
  try {
    loaded = (await c2c.userProfile.preferences.get()).data as UserPreferences;
    preferences.value = loaded;
  } catch {
    toast({ message: $gettext('Your preferences could not be loaded.'), type: 'is-danger' });
    return;
  } finally {
    loading.value = false;
  }

  if (isEmpty(loaded)) {
    notifyWithPreferencesLink($gettext('You have no activity nor area in your preferences.'));
  } else if (applied.value) {
    await removePreferences(loaded);
  } else {
    await applyPreferences(loaded);
  }
}

async function applyPreferences(loaded: UserPreferences) {
  previousFilters = Object.fromEntries(PREFERENCE_PARAMS.map((key) => [key, route.query[key] ?? undefined]));
  const query: LocationQueryRaw = { ...route.query, ...filtersOf(loaded), offset: undefined };
  // the areas replace the extent of the map, and the "near me" radius
  if (query.a !== undefined) {
    query.bbox = undefined;
    query.nmr = undefined;
  }
  await router.push({ query });
}

async function removePreferences(loaded: UserPreferences) {
  // without filters from before (the page was opened with the preferences), the list is no more filtered by them
  const removed = Object.fromEntries(Object.keys(filtersOf(loaded)).map((key) => [key, undefined]));
  const query: LocationQueryRaw = { ...route.query, ...(previousFilters ?? removed), offset: undefined };
  previousFilters = undefined;
  await router.push({ query });
}
</script>
