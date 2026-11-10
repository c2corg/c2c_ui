// The outings waiting on the phone (src/pwa/outing-queue.ts) as the pages show them, and their publication: only
// when the user asks ("Publish now" in My topos), never by itself, so that nothing leaves the phone unexpectedly
import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';
import { toast } from '@/js/toast';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';
import {
  classifyFailure,
  isServerUnavailable,
  listPending,
  newPending,
  withQueue,
  writePending,
  type PendingOuting,
} from '@/pwa/outing-queue';
import { useLanguageStore } from '@/stores/language';
import { useOfflineStore } from '@/stores/offline';
import { useUserStore } from '@/stores/user';

// IndexedDB stores a copy (structured clone), which a reactive proxy of the form cannot give
const plain = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const notify = (message: string, type: 'is-success' | 'is-warning' | 'is-info') =>
  toast({ message, type, position: 'bottom-center', duration: 6000, dismissible: true });

// what the API said, as short as the user can read and show it
function readableError(error: unknown) {
  const { response, message } = (error ?? {}) as {
    response?: { status?: number; data?: { errors?: { name?: string; description?: string }[]; description?: string } };
    message?: string;
  };
  const errors = response?.data?.errors;
  const detail = errors?.length
    ? errors.map((e) => `${e.name ?? 'field'}: ${e.description ?? 'error'}`).join(', ')
    : (response?.data?.description ?? message ?? 'network');
  return response?.status ? `${response.status} — ${detail}` : detail;
}

export const useOutingQueueStore = defineStore('outing-queue', () => {
  // named $gettext: the extraction of the messages to translate (tools/extract-messages.ts) looks for it
  const { gettext: $gettext } = useLanguageStore();
  const user = useUserStore();
  const offline = useOfflineStore();

  // all the outings waiting on the device, and those of the user signed in: on a phone or a computer shared by several
  // people, the drafts of the others stay theirs, out of sight (signed out, nobody's are shown)
  const all = ref<PendingOuting[]>([]);
  const mine = (item: PendingOuting) => user.id !== null && item.owner === user.id;
  const pending = computed(() => all.value.filter(mine));
  const syncing = ref(false);
  // ready to go: not frozen, with a route
  const ready = computed(() => pending.value.filter((item) => !item.conflict && !item.needsRouteAssoc));

  async function refresh() {
    all.value = await listPending();
  }
  // no IndexedDB: nothing waiting
  refresh().catch(() => {});

  // the number of outings waiting, on the icon of the installed app
  watch(
    () => pending.value.length,
    (count) => {
      if ('setAppBadge' in navigator) {
        (count ? navigator.setAppBadge(count) : navigator.clearAppBadge()).catch(() => {});
      }
    }
  );

  // back online with outings ready: say where to publish them
  watch(
    () => offline.online,
    (online) => {
      if (online && ready.value.length) {
        notify($gettext('Outings are ready to be published: open My topos to send them.'), 'is-info');
      }
    }
  );

  async function change(edit: (queue: PendingOuting[]) => PendingOuting[]) {
    all.value = await withQueue(async (queue) => {
      const next = edit(queue);
      await writePending(next);
      return next;
    });
  }

  const update = (id: string, patch: (item: PendingOuting) => Partial<PendingOuting>) =>
    change((queue) => queue.map((item) => (item.id === id ? { ...item, ...patch(item) } : item)));

  const titleOf = (payload: C2cDocument) => payload.locales?.[0]?.title || $gettext('Untitled outing');

  // tried again from the start, as the user asked
  const unfrozen = { conflict: false, freezeReason: null, ambiguous: false, attempts: 0, lastError: null };

  async function publishOne(item: PendingOuting) {
    const payload = { ...item.payload };
    // the author, if the form had not added them (an outing written without a network)
    if (!payload.associations?.users?.length && user.id) {
      payload.associations = {
        ...payload.associations,
        users: [{ document_id: user.id }],
      } as typeof payload.associations;
    }
    try {
      const response = await (c2c.outing as DocumentService).create(payload);
      if (!response?.data?.document_id) {
        throw new Error('no-id');
      }
      await change((queue) => queue.filter((entry) => entry.id !== item.id));
      return 'published';
    } catch (error) {
      const { response, code } = (error ?? {}) as { response?: { status?: number }; code?: string };
      const verdict = classifyFailure(response?.status, item.attempts, code === 'ECONNABORTED');
      await update(item.id, () => ({
        attempts: verdict.attemptsAfter,
        lastError: readableError(error),
        ...(verdict.freeze ? { conflict: true, freezeReason: verdict.reason, ambiguous: verdict.ambiguous } : {}),
      }));
      return isServerUnavailable(response?.status) ? 'unavailable' : verdict.freeze ? 'frozen' : 'failed';
    }
  }

  async function publish() {
    if (syncing.value || !ready.value.length) {
      return;
    }
    if (!user.isLogged) {
      notify($gettext('Sign in to publish your outings. They stay saved on the phone.'), 'is-warning');
      return;
    }
    syncing.value = true;
    const results: string[] = [];
    try {
      for (const item of ready.value) {
        results.push(await publishOne(item));
      }
    } finally {
      syncing.value = false;
    }
    const count = (result: string) => results.filter((r) => r === result).length;
    if (count('published')) {
      notify($gettext('Outings published:') + ' ' + count('published'), 'is-success');
    }
    if (count('frozen')) {
      notify($gettext('Some outings need your decision: see My topos.'), 'is-warning');
    } else if (!count('published') && count('unavailable') === results.length) {
      notify($gettext('Camptocamp is unavailable for now. Your outings stay waiting: try again later.'), 'is-warning');
    } else if (!count('published')) {
      notify($gettext('Publishing failed. Your outings stay waiting: try again from My topos.'), 'is-warning');
    }
  }

  return {
    pending,
    syncing,
    ready,
    refresh,
    publish,
    // a draft opened by its address (?draft=): the user's own only
    get: async (id: string) => (await listPending()).find((item) => item.id === id && mine(item)) ?? null,

    // on the phone, to publish later; with a note when its route could not be found
    async add(payload: C2cDocument, routeNote = '') {
      // the browser may otherwise clear the site's data when the phone is short of space
      navigator.storage?.persist?.().catch(() => {});
      const item = newPending(plain(payload), titleOf(payload), user.id, routeNote.trim());
      await change((queue) => [...queue, item]);
      return item;
    },

    // the draft edited again in the form: null when it was published or removed meanwhile
    async edit(id: string, payload: C2cDocument) {
      let found = false;
      await update(id, (item) => {
        found = true;
        return {
          payload: plain(payload),
          title: titleOf(payload),
          needsRouteAssoc: item.needsRouteAssoc && !payload.associations?.routes?.length,
        };
      });
      return found;
    },

    // the route found back for an outing saved without one: ready to publish
    attachRoute: (id: string, route: { document_id?: number }) =>
      update(id, (item) => {
        const routes = item.payload.associations?.routes ?? [];
        const known = routes.some((r) => r.document_id === route.document_id);
        return {
          ...unfrozen,
          needsRouteAssoc: false,
          payload: {
            ...item.payload,
            associations: {
              ...item.payload.associations,
              routes: known ? routes : [...routes, { document_id: route.document_id }],
            },
          } as C2cDocument,
        };
      }),

    retry: (id: string) => update(id, () => unfrozen),
    remove: (id: string) => change((queue) => queue.filter((item) => item.id !== id)),

    // the outing as a file, to keep it before giving it up
    download(item: PendingOuting) {
      const url = URL.createObjectURL(new Blob([JSON.stringify(item.payload, null, 2)], { type: 'application/json' }));
      const link = Object.assign(document.createElement('a'), { href: url, download: `outing-${item.id}.json` });
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
  };
});
