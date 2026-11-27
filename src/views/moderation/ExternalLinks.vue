<template>
  <div>
    <p class="mb-4" v-translate>
      The links to other sites in the texts of the collaborative documents, as the link checker of the site found them,
      by site. A dead or parked domain, a page that changed completely, or sent to the home page: to correct or remove
      in the texts. A link still fine can be said genuine, a whole site trusted.
    </p>

    <!-- separate buttons: they wrap on a phone -->
    <div class="buttons are-small mb-1">
      <button
        v-for="status of EXTERNAL_LINK_STATUSES"
        :key="status"
        class="button status-filter"
        :class="{ 'is-primary': statuses.includes(status) }"
        :aria-pressed="statuses.includes(status)"
        @click="toggleStatus(status)"
      >
        {{ statusLabel(status) }}&nbsp;<span class="has-text-weight-semibold">{{ counts[status] ?? 0 }}</span>
      </button>
    </div>
    <label class="checkbox is-size-7 mb-3 is-block">
      <input v-model="reviewed" type="checkbox" class="reviewed-filter" @change="reload" />
      <span v-translate>Reviewed (genuine, trusted site)</span>
    </label>

    <p v-if="host" class="mb-2">
      <span class="tag is-info is-light">
        <fa-icon icon="globe" class="mr-1" />{{ host }}
        <button class="delete is-small host-clear" :aria-label="$gettext('All sites')" @click="setHost(null)" />
      </span>
    </p>

    <div v-if="page.error" class="notification is-danger" v-translate>The links could not be loaded.</div>
    <p v-else-if="!page.loading && links.length === 0" class="has-text-grey" v-translate>No link.</p>
    <p v-else-if="!page.loading || links.length" class="has-text-grey is-size-7 mb-2">
      {{ $gettext('Found:') }} {{ total }}
    </p>

    <section v-for="group of groups" :key="group.host" class="mb-5 external-host">
      <div class="is-flex is-align-items-center is-justify-content-space-between host-header">
        <h3 class="is-size-6 has-text-weight-semibold">
          <fa-icon icon="globe" class="mr-1 has-text-grey" />
          <a v-if="!host" class="host-name" :title="$gettext('Only this site')" @click="setHost(group.host)">{{
            group.host
          }}</a>
          <span v-else>{{ group.host }}</span>
          <span v-if="group.trusted" class="tag is-success is-light ml-2" v-translate>Trusted site</span>
        </h3>
        <button
          class="button is-small host-trust"
          :class="{ 'is-loading': busy === 'host:' + group.host }"
          @click="trustHost(group.host, !group.trusted)"
        >
          <span v-if="group.trusted" v-translate>Do not trust this site</span>
          <span v-else v-translate>Trust this site</span>
        </button>
      </div>

      <div v-for="link of group.links" :key="link.url" class="box external-link-item mt-2">
        <div class="is-flex is-justify-content-space-between is-align-items-start">
          <div class="link-body">
            <p class="is-size-7">
              <span class="tag mr-2" :class="STATUS_CLASSES[link.status]">{{ statusLabel(link.status) }}</span>
              <span v-if="detail(link)" class="has-text-grey mr-2">{{ detail(link) }}</span>
              <span
                v-if="link.review"
                class="tag is-light"
                :class="link.review === 'genuine' ? 'is-success' : 'is-danger'"
              >
                {{ reviewLabel(link.review) }}
              </span>
            </p>
            <p class="mt-1 url">
              <a :href="link.url" target="_blank" rel="noopener noreferrer nofollow">{{ link.url }}</a>
            </p>
            <p v-if="link.final_url" class="is-size-7 url">
              <span class="has-text-grey">→</span>
              <a :href="link.final_url" target="_blank" rel="noopener noreferrer nofollow">{{ link.final_url }}</a>
            </p>
            <p v-if="titleChanged(link)" class="is-size-7 mt-1">
              <span class="has-text-grey">{{ $gettext('Title then:') }}</span> « {{ link.first_title }} »
              <span class="has-text-grey">{{ $gettext('now:') }}</span> « {{ link.last_title }} »
            </p>
            <p v-else-if="link.last_title" class="is-size-7 mt-1">
              <span class="has-text-grey">{{ $gettext('Title:') }}</span> « {{ link.last_title }} »
            </p>
            <p class="is-size-7 has-text-grey mt-1">
              <template v-if="link.failures && link.first_failure_at">
                {{ $gettext('Failures:') }} {{ link.failures }}, {{ $gettext('since') }}
                {{ $dateUtils.toLocalizedString(link.first_failure_at, 'll') }} ·
              </template>
              <template v-if="link.last_checked_at">
                {{ $gettext('Checked') }} {{ $dateUtils.timeAgo(link.last_checked_at) }}
              </template>
              <template v-else>{{ $gettext('Not checked yet') }}</template>
              <template v-if="rechecked.has(link.url)"> · {{ $gettext('checked again within 10 minutes') }}</template>
            </p>
            <ul class="mt-2 documents">
              <li v-for="doc of link.documents" :key="doc.document_id">
                <icon-document :document-type="letterToDocumentType[doc.document_type]" fixed-width />
                <router-link :to="documentRoute(doc.document_type, doc.document_id, doc.langs[0])">
                  {{ titleOf(doc) }}
                </router-link>
                <span v-for="lang of doc.langs" :key="lang" class="tag is-light ml-1">{{ lang }}</span>
              </li>
              <li v-if="link.documents_count > link.documents.length" class="has-text-grey is-size-7">
                {{ $gettext('and others:') }} {{ link.documents_count - link.documents.length }}
              </li>
            </ul>
          </div>

          <div class="buttons are-small is-flex-shrink-0 ml-3 is-flex-direction-column is-align-items-stretch">
            <template v-if="link.review">
              <button
                class="button review-undo"
                :class="{ 'is-loading': busy === link.url }"
                @click="review(link, null)"
              >
                <span v-translate>Undo the review</span>
              </button>
            </template>
            <template v-else>
              <button
                class="button is-success is-light review-genuine"
                :class="{ 'is-loading': busy === link.url }"
                :title="$gettext('The link still leads to the right page')"
                @click="review(link, 'genuine')"
              >
                <fa-icon icon="check" class="mr-1" /><span v-translate>Genuine</span>
              </button>
              <button
                class="button is-danger is-light review-taken-over"
                :class="{ 'is-loading': busy === link.url }"
                :title="$gettext('The domain was taken over: the link must be removed')"
                @click="review(link, 'taken_over')"
              >
                <span v-translate>Taken over</span>
              </button>
            </template>
            <button
              class="button recheck"
              :disabled="rechecked.has(link.url)"
              :class="{ 'is-loading': busy === 'recheck:' + link.url }"
              @click="recheck(link)"
            >
              <fa-icon icon="rotate" class="mr-1" /><span v-translate>Check again</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <div v-if="actionError" class="notification is-danger" v-translate>The change could not be saved.</div>

    <div class="has-text-centered mt-4">
      <button
        v-if="links.length < total"
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
import { computed, reactive, ref, shallowRef } from 'vue';

import { documentRoute, documentTitle, type ListedDocument } from './deleted-documents';

import type { ApiData } from '@/js/apis/BaseApi';
import c2c from '@/js/apis/c2c';
import { EXTERNAL_LINK_STATUSES, type ExternalLink, type ExternalLinkStatus } from '@/js/apis/c2c/schemas';
import { useGlobalProperties } from '@/js/composables/global-properties';
import constants from '@/js/constants';

const PAGE_SIZE = 30;

// listed by default, as the API: the links that need a look
const DEFAULT_STATUSES: ExternalLinkStatus[] = ['dead', 'failing', 'parked', 'suspect', 'offsite'];

// red: gone; orange: probably no longer the site linked; yellow: elsewhere; blue: same site, another address
const STATUS_CLASSES: Record<ExternalLinkStatus, string> = {
  dead: 'is-danger',
  failing: 'is-danger is-light',
  parked: 'is-warning',
  suspect: 'is-warning',
  offsite: 'is-warning is-light',
  moved: 'is-info is-light',
  blocked: 'is-light',
  ok: 'is-success is-light',
  unchecked: 'is-light',
};

const { $gettext, $documentUtils } = useGlobalProperties();
const { letterToDocumentType } = constants;

const titleOf = (doc: ListedDocument) => documentTitle($documentUtils, doc);

const statuses = ref<ExternalLinkStatus[]>([...DEFAULT_STATUSES]);
const reviewed = ref(false);
const host = ref<string | null>(null);

const links = ref<ExternalLink[]>([]);
const total = ref(0);
const counts = ref<Record<string, number>>({});
const page = shallowRef<ApiData>(load(0));

// the action going on: a URL (review), 'recheck:' + URL, 'host:' + host
const busy = ref<string | null>(null);
const actionError = ref(false);
const rechecked = reactive(new Set<string>());

/** The links of the page by site, in the order of the API (by host) */
const groups = computed(() => {
  const result: { host: string; trusted: boolean; links: ExternalLink[] }[] = [];
  for (const link of links.value) {
    const last = result[result.length - 1];
    if (last?.host === link.host) {
      last.links.push(link);
    } else {
      result.push({ host: link.host, trusted: link.host_review === 'trusted', links: [link] });
    }
  }
  return result;
});

function statusLabel(status: ExternalLinkStatus): string {
  switch (status) {
    case 'dead':
      return $gettext('Dead');
    case 'failing':
      return $gettext('Failing');
    case 'parked':
      return $gettext('Domain for sale');
    case 'suspect':
      return $gettext('Changed page');
    case 'offsite':
      return $gettext('On another site');
    case 'moved':
      return $gettext('Moved');
    case 'blocked':
      return $gettext('Not checkable');
    case 'ok':
      return $gettext('OK');
    default:
      return $gettext('Not checked yet');
  }
}

/** Why it failed, or the HTTP status of the answer */
function detail(link: ExternalLink): string | null {
  switch (link.error) {
    case 'dns':
      return $gettext('No such domain');
    case 'dns_temporary':
      return $gettext('Domain not found for now');
    case 'private':
      return $gettext('Private address');
    case 'tls':
      return $gettext('Invalid certificate');
    case 'tls_chain':
      return $gettext('Incomplete certificate');
    case 'refused':
      return $gettext('Connection refused');
    case 'connection':
      return $gettext('Connection error');
    case 'timeout':
      return $gettext('No answer');
    case 'too_many_redirects':
      return $gettext('Too many redirections');
    case 'port':
      return $gettext('Unusual port');
    case 'scheme':
      return $gettext('Redirected out of the web');
    case 'home':
      return $gettext('Sent to the home page');
    case 'login':
      return $gettext('Sent to a login page');
    default:
      return link.http_status && link.http_status !== 200 ? `HTTP ${link.http_status}` : null;
  }
}

function reviewLabel(review: string): string {
  return review === 'genuine' ? $gettext('Reviewed genuine') : $gettext('Reviewed taken over');
}

/** A page whose title has nothing in common with the first one seen (suspect) */
const titleChanged = (link: ExternalLink) =>
  link.status === 'suspect' && !!link.first_title && !!link.last_title && link.first_title !== link.last_title;

function load(offset: number): ApiData {
  return c2c.moderator
    .getExternalLinks(offset, PAGE_SIZE, {
      statuses: statuses.value,
      host: host.value ?? undefined,
      reviewed: reviewed.value,
    })
    .then((response) => {
      const known = new Set(links.value.map((link) => link.url));
      links.value.push(...response.data.links.filter((link) => !known.has(link.url)));
      total.value = response.data.total;
      counts.value = response.data.counts;
    });
}

function reload() {
  links.value = [];
  total.value = 0;
  page.value = load(0);
}

function loadMore() {
  page.value = load(links.value.length);
}

function toggleStatus(status: ExternalLinkStatus) {
  const selected = statuses.value.includes(status)
    ? statuses.value.filter((s) => s !== status)
    : [...statuses.value, status];
  // none selected: the default ones (as the API)
  statuses.value = selected.length ? selected : [...DEFAULT_STATUSES];
  reload();
}

function setHost(value: string | null) {
  host.value = value;
  reload();
}

function act(key: string, action: () => ApiData, after: () => void) {
  busy.value = key;
  actionError.value = false;
  action().then(
    () => {
      busy.value = null;
      after();
    },
    () => {
      busy.value = null;
      actionError.value = true;
    }
  );
}

function review(link: ExternalLink, value: 'genuine' | 'taken_over' | null) {
  act(
    link.url,
    () => c2c.moderator.reviewExternalLink(link.url, value),
    () => {
      // a genuine link leaves the list of the others, and comes back to it without review
      if ((value === 'genuine' && !reviewed.value) || (value === null && reviewed.value)) {
        reload();
      } else {
        link.review = value;
      }
    }
  );
}

function trustHost(name: string, trusted: boolean) {
  act(
    'host:' + name,
    () => c2c.moderator.reviewExternalHost(name, trusted ? 'trusted' : null),
    () => reload()
  );
}

function recheck(link: ExternalLink) {
  act(
    'recheck:' + link.url,
    () => c2c.moderator.recheckExternalLink(link.url),
    () => rechecked.add(link.url)
  );
}
</script>

<style scoped>
.url {
  overflow-wrap: anywhere;
}

.link-body {
  min-width: 0;
}

.documents {
  list-style: none;
}

.host-header {
  border-bottom: 1px solid var(--c2c-grey-lightest);
  padding-bottom: 0.25rem;
}

.host-name {
  cursor: pointer;
}
</style>
