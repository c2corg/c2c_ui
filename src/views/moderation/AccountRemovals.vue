<template>
  <div>
    <p class="mb-4" v-translate>
      An account is removed (anonymized, merged into another account of the user, or deleted with its contributions if
      it is spam) once a moderator of the topoguide and a moderator of the forum have validated the request: two
      different persons, other than its author. It is processed one day after the last validation, and not before its
      date.
    </p>

    <div class="tabs is-small is-toggle mb-4">
      <ul>
        <li v-for="item of STATUSES" :key="item" :class="{ 'is-active': item === status }">
          <a @click="setStatus(item)">{{ statusLabels[item] }}</a>
        </li>
      </ul>
    </div>

    <div v-if="page.error" class="notification is-danger" v-translate>The removal requests could not be loaded.</div>
    <p v-else-if="!page.loading && removals.length === 0" class="has-text-grey">
      {{ status === 'open' ? $gettext('No request to handle.') : $gettext('No request.') }}
    </p>

    <account-removal-item v-for="removal of removals" :key="removal.id" :removal="removal" @changed="onChanged" />

    <div class="has-text-centered mt-4">
      <button
        v-if="removals.length < total"
        class="button"
        :class="{ 'is-loading': page.loading }"
        @click="loadMore"
        v-translate
      >
        More
      </button>
      <span v-else-if="page.loading" class="button is-loading is-white" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue';

import AccountRemovalItem from './AccountRemovalItem.vue';

import type { ApiData } from '@/js/apis/BaseApi';
import c2c from '@/js/apis/c2c';
import type { AccountRemoval } from '@/js/apis/c2c/schemas';
import { useGlobalProperties } from '@/js/composables/global-properties';

const PAGE_SIZE = 30;
// the open ones by default: the done and cancelled ones are only loaded when asked
const STATUSES = ['open', 'done', 'cancelled'] as const;
type Status = (typeof STATUSES)[number];

const emit = defineEmits<{ count: [open: number] }>();

const { $gettext } = useGlobalProperties();

const statusLabels = computed<Record<Status, string>>(() => ({
  open: $gettext('To handle'),
  done: $gettext('Done'),
  cancelled: $gettext('Cancelled'),
}));

const status = ref<Status>('open');
const removals = ref<AccountRemoval[]>([]);
const total = ref(0);
// a page answered after the status changed is dropped
let generation = 0;
const page = shallowRef<ApiData>(load(0));

function load(offset: number): ApiData {
  const current = generation;
  return c2c.moderator.getAccountRemovals(status.value, offset, PAGE_SIZE).then((response) => {
    if (current !== generation) {
      return;
    }
    removals.value.push(...response.data.removals);
    total.value = response.data.total;
    if (status.value === 'open') {
      emit('count', total.value);
    }
  });
}

function setStatus(value: Status) {
  status.value = value;
  generation += 1;
  removals.value = [];
  total.value = 0;
  page.value = load(0);
}

function loadMore() {
  page.value = load(removals.value.length);
}

// a request done or cancelled stays shown until the list is loaded again
function onChanged(removal: AccountRemoval) {
  removals.value = removals.value.map((r) => (r.id === removal.id ? removal : r));
}
</script>
