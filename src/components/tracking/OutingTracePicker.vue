<template>
  <!-- The trace of an outing comes from the user's watch (Strava, Garmin, Suunto...) through the tracking service of
       camptocamp.org. Nothing while it loads, nor when the service cannot be reached (no network): the file import on
       the map stays -->
  <div v-if="state === 'connect'" class="trace-picker-hint">
    <fa-icon icon="route" />
    {{ $gettext('Find here the traces of your Strava, Garmin, Suunto... activities.') }}
    <router-link :to="{ name: 'trackers' }">{{ $gettext('Connect my account') }}</router-link>
  </div>
  <div v-else-if="state === 'list'" class="field trace-picker">
    <p id="trace-picker-label" class="label">{{ $gettext('Trace of the outing') }}</p>
    <ul aria-labelledby="trace-picker-label">
      <li v-for="activity of activities" :key="activity.id">
        <button
          type="button"
          class="trace-picker-row"
          :class="{ 'is-picked': activity.id === pickedId }"
          :aria-pressed="activity.id === pickedId"
          @click="pick(activity)"
        >
          <fa-icon
            :icon="loadingId === activity.id ? 'spinner' : activity.id === pickedId ? 'circle-check' : 'route'"
            :spin="loadingId === activity.id"
            fixed-width
          />
          <span class="trace-picker-day">{{ $dateUtils.toLocalizedString(activity.date, 'ddd D MMM') }}</span>
          <span class="trace-picker-name">{{ activity.name || activity.type[$language.current ?? ''] }}</span>
          <span class="trace-picker-figures">{{ figuresOf(activity) }}</span>
        </button>
      </li>
    </ul>
    <p v-if="pickedId !== null" class="help">
      {{
        $gettext(
          'Trace and date taken from this activity, distance and elevation gain too when known. Check them before publishing.'
        )
      }}
    </p>
  </div>
  <p v-else-if="state === 'empty'" class="trace-picker-hint">
    <fa-icon icon="route" />
    {{ $gettext('No activity received from your account yet: it will show here once your watch is synchronized.') }}
  </p>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';

import trackingService, { type Activity, type Geometry } from '@/js/apis/tracking-service';
import { useGlobalProperties } from '@/js/composables/global-properties';
import { toast } from '@/js/toast';

defineProps<{ pickedId: number | null }>();
const emit = defineEmits<{ pick: [{ activity: Activity; geometry: Geometry }] }>();

const { $gettext, $user, $language } = useGlobalProperties();

const SHOWN_ACTIVITIES = 3;
// new lines push the form under a finger that was aiming at it: no pick that soon after they appear
const SETTLE_MS = 1000;

const state = ref<'connect' | 'list' | 'empty' | null>(null);
const activities = ref<Activity[]>([]);
const loadingId = ref<number | null>(null);
let shownAt = 0;
let loads = 0;

async function load() {
  const userId = $user.id!;
  const n = ++loads;
  try {
    const { data: status } = await trackingService.getStatus(userId);
    if (n !== loads) {
      return;
    }
    if (!Object.values(status ?? {}).includes('configured')) {
      state.value = 'connect';
      return;
    }
    const { data: list } = await trackingService.getActivities(userId, $language.current ?? undefined);
    if (n !== loads) {
      return;
    }
    const shown = [...(list ?? [])].sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, SHOWN_ACTIVITIES);
    if (String(shown.map((a) => a.id)) !== String(activities.value.map((a) => a.id))) {
      shownAt = Date.now();
    }
    activities.value = shown;
    state.value = shown.length ? 'list' : 'empty';
  } catch {
    // no network, service unavailable: nothing shown, the file import stays
  }
}

// back from the watch's app, the new activity is there
function onVisibilityChange() {
  if (document.visibilityState === 'visible' && loadingId.value === null) {
    void load();
  }
}
void load();
document.addEventListener('visibilitychange', onVisibilityChange);
onBeforeUnmount(() => document.removeEventListener('visibilitychange', onVisibilityChange));

async function pick(activity: Activity) {
  if (loadingId.value !== null || Date.now() - shownAt < SETTLE_MS) {
    return;
  }
  loadingId.value = activity.id;
  try {
    const { data } = await trackingService.getActivityGeometry($user.id!, activity.id);
    if (!data?.coordinates?.length) {
      toast({ message: $gettext('This activity has no GPS trace.'), type: 'is-warning', position: 'center' });
      return;
    }
    emit('pick', { activity, geometry: data });
  } catch {
    toast({ message: $gettext('Geographical data could not be retrieved'), type: 'is-danger', position: 'center' });
  } finally {
    loadingId.value = null;
  }
}

// ponytail: kilometers and meters; the unit setting of the app comes with lot 4
function figuresOf(activity: Activity) {
  const parts = [];
  if (activity.length) {
    parts.push(
      `${(activity.length / 1000).toLocaleString($language.current ?? undefined, { maximumFractionDigits: 1 })} km`
    );
  }
  if (activity.heightDiffUp) {
    parts.push(`+${Math.round(activity.heightDiffUp)} m`);
  }
  return parts.join(' · ');
}
</script>

<style scoped>
.trace-picker-hint {
  margin-bottom: 0.75rem;
  color: var(--c2c-grey);
  font-size: 0.9rem;
}

.trace-picker ul {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.trace-picker-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--c2c-grey-lighter);
  border-radius: 6px;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;

  &.is-picked {
    border-color: var(--c2c-primary);
    color: var(--c2c-primary);
  }
}

.trace-picker-day {
  flex-shrink: 0;
  font-weight: 600;
}

.trace-picker-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.trace-picker-figures {
  flex-shrink: 0;
  color: var(--c2c-grey);
  font-size: 0.85rem;
}
</style>
