<template>
  <div>
    <div class="control">
      <label class="label">{{ $filters.uppercaseFirstLetter($gettext('date_start')) }}</label>
      <input class="input" type="date" v-model="value[0]" />
    </div>
    <div class="control">
      <label class="label">{{ $filters.uppercaseFirstLetter($gettext('date_end')) }}</label>
      <input class="input" type="date" v-model="value[1]" />
    </div>
    <input-checkbox v-model="usePeriodFilter" class="checkbox">{{ $gettext('Ignore year') }}</input-checkbox>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

const value = ref<(string | null)[]>([null, null]);
const usePeriodFilter = ref(false);

const currentQueryKey = computed(() => (usePeriodFilter.value ? 'period' : 'date'));

function updateDateInUrl() {
  const dates = [value.value[0], value.value[1]].filter(Boolean).join(',');

  if (dates !== route.query[currentQueryKey.value]) {
    pushQueryObjectToUrl({ [currentQueryKey.value]: dates || undefined });
  }
}

function switchFilterInUrl() {
  const oldQueryKey = usePeriodFilter.value ? 'date' : 'period';
  const existingQueryString = route.query[oldQueryKey];

  if (!existingQueryString) return;

  pushQueryObjectToUrl({
    [oldQueryKey]: undefined,
    [currentQueryKey.value]: String(existingQueryString),
  });
}

function pushQueryObjectToUrl(queryObject: Record<string, string | undefined>) {
  router.push({
    query: {
      ...route.query,
      ...queryObject,
    },
  });
}

// deep 1: also when a date of the array changes, as Vue 2 array watchers did
watch(value, updateDateInUrl, { deep: 1 });
watch(usePeriodFilter, switchFilterInUrl);

// after the watchers, as the created() of the options component was
const dateQueryString = route.query.date ? String(route.query.date) : '';
const periodQueryString = route.query.period ? String(route.query.period) : '';

if (periodQueryString) {
  value.value = periodQueryString.split(',');
  usePeriodFilter.value = true;
} else if (dateQueryString) {
  value.value = dateQueryString.split(',');
}
</script>
<style scoped lang="scss">
.checkbox {
  margin-top: 10px;
}
</style>
