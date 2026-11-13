<template>
  <div class="section">
    <html-header :title="$gettext('Account removals')" />
    <h1 class="title is-1" v-translate>Account removals</h1>

    <div class="content">
      <p v-translate>
        An account is removed (anonymized, merged or deleted if it is spam) once the request has been validated by a
        moderator of the topoguide and by a moderator of the forum, who are two different persons and are not the author
        of the request. The removal is then done after the given date.
      </p>
    </div>

    <loading-notification :promise="removals" />

    <div v-if="removals.data" class="table-container">
      <table class="table is-fullwidth is-striped">
        <thead>
          <tr>
            <th v-translate>Account</th>
            <th v-translate>Reason</th>
            <th v-translate>Removal from</th>
            <th v-translate>Merged into</th>
            <th v-translate>Request</th>
            <th v-translate>Validation by the topoguide</th>
            <th v-translate>Validation by the forum</th>
            <th v-translate>Status</th>
            <th v-translate>Forum discussion</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="removal of removals.data.removals" :key="removal.id">
            <td>
              <router-link v-if="removal.status !== 'done'" :to="{ name: 'profile', params: { id: removal.user_id } }">
                {{ removal.user_name }}
              </router-link>
              <span v-else>{{ removal.user_name }}</span>
              <div class="is-size-7">
                {{ removal.user_forum_username }}<br />
                <span v-translate>Topoguide id:</span> {{ removal.user_id }}<br />
                <span v-translate>Forum id:</span> {{ removal.forum_id ?? '?' }}
              </div>
            </td>
            <td>{{ reasonLabel(removal.reason) }}</td>
            <td>{{ removal.executable_after }}</td>
            <td class="is-size-7">
              <span v-translate>Topoguide id:</span>
              <router-link :to="{ name: 'profile', params: { id: removal.target_user_id } }">
                {{ removal.target_user_id }}
              </router-link>
              <br />
              <span v-translate>Forum id:</span> {{ removal.target_forum_id }}
            </td>
            <td class="is-size-7">
              {{ removal.created_at.slice(0, 10) }}<br />
              <router-link :to="{ name: 'profile', params: { id: removal.requested_by.id } }">
                {{ removal.requested_by.name ?? removal.requested_by.id }}
              </router-link>
            </td>
            <td v-for="side of sides" :key="side" class="is-size-7">
              <template v-if="validator(removal, side)">
                <router-link :to="{ name: 'profile', params: { id: validator(removal, side)!.id } }">
                  {{ validator(removal, side)!.name ?? validator(removal, side)!.id }}
                </router-link>
                <br />
                {{ validationDate(removal, side) }}
              </template>
              <button
                v-else-if="canValidate(removal, side)"
                class="button is-small is-success"
                @click="validate(removal, side)"
                v-translate
              >
                Validate the removal
              </button>
              <span v-else>-</span>
            </td>
            <td>
              <span class="tag" :class="statusClass(removal.status)">{{ statusLabel(removal.status) }}</span>
            </td>
            <td class="forum-url">
              <template v-if="removal.status === 'done'">
                <a v-if="removal.forum_url" :href="removal.forum_url" rel="noopener noreferrer">{{
                  removal.forum_url
                }}</a>
              </template>
              <template v-else>
                <input
                  class="input is-small"
                  type="url"
                  placeholder="https://"
                  :aria-label="$gettext('Forum discussion')"
                  :value="urlOf(removal)"
                  @input="urls[removal.id] = ($event.target as HTMLInputElement).value"
                />
                <a v-if="removal.forum_url" :href="removal.forum_url" rel="noopener noreferrer" class="is-size-7">
                  <fa-icon icon="external-link-alt" />
                </a>
                <button
                  v-if="removal.status === 'in_progress' && canManage"
                  class="button is-small"
                  :disabled="!urlChanged(removal)"
                  @click="saveUrl(removal)"
                  v-translate
                >
                  Save
                </button>
              </template>
            </td>
            <td>
              <template v-if="removal.status !== 'done'">
                <button
                  v-for="side of sides"
                  v-show="canUnvalidate(removal, side)"
                  :key="side"
                  class="button is-small is-warning"
                  :disabled="!urlOf(removal)"
                  :title="$gettext('The forum discussion is required to cancel a validation')"
                  @click="unvalidate(removal, side)"
                >
                  {{
                    side === 'topoguide'
                      ? $gettext('Cancel the topoguide validation')
                      : $gettext('Cancel the forum validation')
                  }}
                </button>
                <button v-if="canManage" class="button is-small is-danger" @click="cancel(removal)" v-translate>
                  Cancel the request
                </button>
              </template>
            </td>
          </tr>
          <tr v-if="removals.data.removals.length === 0">
            <td colspan="10" class="has-text-centered" v-translate>No removal request.</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';

import type { ApiData } from '@/js/apis/BaseApi';
import c2c from '@/js/apis/c2c';
import type {
  AccountRemoval,
  AccountRemovalReason,
  AccountRemovalSide,
  AccountRemovalStatus,
} from '@/js/apis/c2c/ModeratorService';
import { useGlobalProperties } from '@/js/composables/global-properties';
import { useNoRobots } from '@/js/composables/head';

useNoRobots();

const { $gettext, $user } = useGlobalProperties();

const sides: AccountRemovalSide[] = ['topoguide', 'forum'];

const removals = ref<ApiData<{ removals: AccountRemoval[]; roles: Record<AccountRemovalSide, boolean> }>>(
  c2c.moderator.getAccountRemovals()
);

// the forum discussions being typed, by request
const urls = reactive<Record<number, string>>({});

const roles = computed(() => removals.value.data?.roles ?? { topoguide: false, forum: false });
const canManage = computed(() => roles.value.topoguide || roles.value.forum);

function load() {
  removals.value = c2c.moderator.getAccountRemovals();
}

function urlOf(removal: AccountRemoval) {
  return urls[removal.id] ?? removal.forum_url ?? '';
}

function urlChanged(removal: AccountRemoval) {
  const url = urlOf(removal).trim();
  return url !== '' && url !== (removal.forum_url ?? '');
}

function validator(removal: AccountRemoval, side: AccountRemovalSide) {
  return side === 'topoguide' ? removal.topoguide_validated_by : removal.forum_validated_by;
}

function validationDate(removal: AccountRemoval, side: AccountRemovalSide) {
  const date = side === 'topoguide' ? removal.topoguide_validated_at : removal.forum_validated_at;
  return date ? date.slice(0, 10) : '';
}

// the author of a request cannot validate it, and nobody can validate both sides (the API checks it too)
function canValidate(removal: AccountRemoval, side: AccountRemovalSide) {
  const other = validator(removal, side === 'topoguide' ? 'forum' : 'topoguide');
  return (
    removal.status !== 'done' && roles.value[side] && removal.requested_by.id !== $user.id && other?.id !== $user.id
  );
}

function canUnvalidate(removal: AccountRemoval, side: AccountRemovalSide) {
  return removal.status !== 'done' && roles.value[side] && validator(removal, side) !== null;
}

function validate(removal: AccountRemoval, side: AccountRemovalSide) {
  c2c.moderator.validateAccountRemoval(removal.id, side).then(load);
}

function unvalidate(removal: AccountRemoval, side: AccountRemovalSide) {
  const url = urlOf(removal).trim();
  delete urls[removal.id];
  c2c.moderator.unvalidateAccountRemoval(removal.id, side, url).then(load);
}

function saveUrl(removal: AccountRemoval) {
  c2c.moderator.updateAccountRemovalUrl(removal.id, urlOf(removal).trim()).then(() => {
    delete urls[removal.id];
    load();
  });
}

function cancel(removal: AccountRemoval) {
  if (window.confirm($gettext('Are you sure you want to cancel this request?'))) {
    c2c.moderator.cancelAccountRemoval(removal.id).then(load);
  }
}

function reasonLabel(reason: AccountRemovalReason) {
  return {
    anonymization: $gettext('Anonymization'),
    merge: $gettext('Merge with another account'),
    spam: $gettext('Spam'),
  }[reason];
}

function statusLabel(status: AccountRemovalStatus) {
  return {
    in_progress: $gettext('In progress'),
    validated: $gettext('Validated'),
    done: $gettext('Done'),
  }[status];
}

function statusClass(status: AccountRemovalStatus) {
  return { 'is-warning': status === 'in_progress', 'is-info': status === 'validated', 'is-success': status === 'done' };
}
</script>

<style scoped>
.forum-url {
  min-width: 14rem;
}

td .button {
  margin: 0.1rem;
}
</style>
