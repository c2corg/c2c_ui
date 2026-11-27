<template>
  <div class="box">
    <div class="is-flex is-justify-content-space-between is-align-items-start">
      <div>
        <p class="is-size-5">
          <fa-icon icon="user" fixed-width />
          <!-- the account no longer exists once done -->
          <router-link v-if="removal.status !== 'done'" :to="{ name: 'profile', params: { id: removal.user_id } }">
            {{ removal.user_name }}
          </router-link>
          <span v-else>{{ removal.user_name }}</span>
          <span class="has-text-grey is-size-6 ml-1">({{ removal.user_forum_username }})</span>
          <span class="tag ml-2" :class="REASON_CLASSES[removal.reason]">{{ reasonLabel }}</span>
          <span class="tag ml-1" :class="STATUS_CLASSES[removal.status]">{{ statusLabel }}</span>
        </p>

        <p class="mt-1 is-size-7">
          <span v-translate>Topoguide id:</span> {{ removal.user_id }} · <span v-translate>Forum id:</span>
          {{ removal.forum_id ?? '?' }}
          <fa-icon icon="arrow-right" class="mx-1" />
          <template v-if="removal.reason === 'merge'">
            <router-link :to="{ name: 'profile', params: { id: removal.target_user_id } }">
              {{ removal.target_user_id }}
            </router-link>
            <span> · </span>
            <span v-translate>Forum id:</span> {{ removal.target_forum_id }}
          </template>
          <span v-else v-translate>the closed account</span>
        </p>

        <p class="mt-1 is-size-7">
          <template v-if="removal.user_request_date">
            {{ $gettext('Asked by the user on:') }} {{ $dateUtils.toLocalizedString(removal.user_request_date, 'll') }}
            ·
          </template>
          {{ $gettext('Not before:') }} {{ $dateUtils.toLocalizedString(removal.executable_after, 'll') }}
          <template v-if="removal.ready_at">
            ·
            <strong
              >{{ $gettext('Processed from:') }} {{ $dateUtils.toLocalizedString(removal.ready_at, 'lll') }}</strong
            >
          </template>
          <template v-if="removal.done_at">
            · {{ $gettext('Done on:') }} {{ $dateUtils.toLocalizedString(removal.done_at, 'lll') }}
          </template>
          <template v-if="removal.cancelled_at">
            · {{ $gettext('Cancelled by') }} {{ name(removal.cancelled_by) }},
            {{ $dateUtils.toLocalizedString(removal.cancelled_at, 'lll') }}
          </template>
        </p>

        <p class="mt-1 is-size-7">
          {{ $gettext('Requested by') }}
          <router-link :to="{ name: 'profile', params: { id: removal.requested_by.id } }">{{
            name(removal.requested_by)
          }}</router-link>, {{ $dateUtils.toLocalizedString(removal.created_at, 'lll') }}
          <template v-if="removal.forum_url">
            ·
            <a :href="removal.forum_url" target="_blank" rel="noopener noreferrer">
              <icon-forum /> <span v-translate>Forum discussion</span>
            </a>
          </template>
        </p>
      </div>

      <div class="buttons is-flex-shrink-0 ml-3">
        <button class="button" @click="showHistory = !showHistory">
          <fa-icon :icon="showHistory ? 'chevron-up' : 'chevron-down'" class="mr-1" />
          <span v-translate>Request history</span>
        </button>
        <button v-if="removal.can.cancel" class="button is-danger is-light" @click="ask('cancel')">
          <span v-translate>Cancel the request</span>
        </button>
      </div>
    </div>

    <!-- one moderator of each side validates: the author of the request validates nothing -->
    <div class="columns is-mobile mt-2">
      <div v-for="side of ACCOUNT_REMOVAL_SIDES" :key="side" class="column">
        <div class="validation" :class="{ 'is-validated': validator(side) }">
          <p class="has-text-weight-semibold is-size-7">
            {{ side === 'topoguide' ? $gettext('Topoguide validation') : $gettext('Forum validation') }}
          </p>
          <p v-if="validator(side)" class="is-size-7">
            <fa-icon icon="check" class="has-text-success mr-1" />
            <router-link :to="{ name: 'profile', params: { id: validator(side)!.id } }">{{
              name(validator(side))
            }}</router-link>, {{ $dateUtils.toLocalizedString(validatedAt(side)!, 'lll') }}
          </p>
          <p v-else class="is-size-7 has-text-grey" v-translate>Waiting</p>
          <button
            v-if="removal.can.validate.includes(side)"
            class="button is-success mt-2"
            :class="{ 'is-loading': sending }"
            @click="validate(side)"
            v-translate
          >
            Validate
          </button>
          <button
            v-if="removal.can.unvalidate.includes(side)"
            class="button is-warning is-light mt-2"
            @click="ask('unvalidate', side)"
            v-translate
          >
            Withdraw the validation
          </button>
        </div>
      </div>
    </div>

    <div v-if="removal.can.update" class="field has-addons mt-2">
      <div class="control is-expanded">
        <input
          v-model="forumUrl"
          class="input"
          type="url"
          placeholder="https://forum.camptocamp.org/t/…"
          :aria-label="$gettext('Forum discussion')"
        />
      </div>
      <div class="control">
        <button class="button" :disabled="!urlChanged" @click="saveUrl" v-translate>Save</button>
      </div>
    </div>

    <table v-if="showHistory" class="table is-narrow is-fullwidth is-size-7 mt-3">
      <tbody>
        <tr v-for="(event, i) of removal.history" :key="i">
          <td class="has-text-grey">{{ $dateUtils.toLocalizedString(event.at, 'lll') }}</td>
          <td>{{ actionLabel(event.action, event.side) }}</td>
          <td>{{ event.by ? name(event.by) : $gettext('the removal script') }}</td>
          <td>
            <a v-if="event.forum_url" :href="event.forum_url" target="_blank" rel="noopener noreferrer">
              <icon-forum />
            </a>
            <span v-if="event.action === 'done'" class="has-text-grey">{{ doneDetails(event) }}</span>
          </td>
        </tr>
      </tbody>
    </table>

    <modal-confirmation
      ref="confirmation"
      :promise="pending"
      :confirm-class="action === 'cancel' ? 'is-danger' : 'is-warning'"
      cancel-class=""
      @confirm="confirm"
    >
      <template #title>
        {{ action === 'cancel' ? $gettext('Cancel the request') : $gettext('Withdraw the validation') }}
      </template>
      <p>
        <strong>{{ removal.user_name }}</strong>
      </p>
      <p class="mt-2">
        {{
          action === 'cancel'
            ? $gettext('The account will not be removed. The request is kept, cancelled, and a new one can be made.')
            : $gettext('The request goes back in progress, until a moderator of this side validates it again.')
        }}
      </p>
      <div class="field mt-3">
        <label class="label" v-translate>Forum discussion (optional, the current one is kept)</label>
        <input v-model="actionUrl" class="input" type="url" placeholder="https://" />
      </div>
      <template #confirm-label>
        {{ action === 'cancel' ? $gettext('Cancel the request') : $gettext('Withdraw') }}
      </template>
    </modal-confirmation>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef, useTemplateRef, watch, type PropType } from 'vue';

import type { ApiData } from '@/js/apis/BaseApi';
import c2c from '@/js/apis/c2c';
import {
  ACCOUNT_REMOVAL_SIDES,
  type AccountRemoval,
  type AccountRemovalReason,
  type AccountRemovalSide,
  type AccountRemovalStatus,
} from '@/js/apis/c2c/schemas';
import { useGlobalProperties } from '@/js/composables/global-properties';

const props = defineProps({
  removal: {
    type: Object as PropType<AccountRemoval>,
    required: true,
  },
});

const emit = defineEmits<{ changed: [removal: AccountRemoval] }>();

const { $gettext } = useGlobalProperties();

const REASON_CLASSES: Record<AccountRemovalReason, string> = {
  anonymization: 'is-info is-light',
  merge: 'is-link is-light',
  spam: 'is-danger is-light',
};
const STATUS_CLASSES: Record<AccountRemovalStatus, string> = {
  in_progress: 'is-warning',
  validated: 'is-info',
  done: 'is-success',
  cancelled: 'is-light',
};

const reasonLabel = computed(
  () =>
    ({
      anonymization: $gettext('Anonymization'),
      merge: $gettext('Merge with another account'),
      spam: $gettext('Spam'),
    })[props.removal.reason]
);
const statusLabel = computed(
  () =>
    ({
      in_progress: $gettext('In progress'),
      validated: $gettext('Validated'),
      done: $gettext('Done'),
      cancelled: $gettext('Cancelled'),
    })[props.removal.status]
);

const showHistory = ref(false);
const sending = ref(false);
const forumUrl = ref(props.removal.forum_url ?? '');
watch(
  () => props.removal.forum_url,
  (url) => (forumUrl.value = url ?? '')
);
const urlChanged = computed(() => forumUrl.value.trim() !== '' && forumUrl.value.trim() !== props.removal.forum_url);

type Action = 'cancel' | 'unvalidate';
const action = ref<Action>('cancel');
const actionSide = ref<AccountRemovalSide>('topoguide');
const actionUrl = ref('');
const pending = shallowRef<ApiData<AccountRemoval> | null>(null);
const confirmation = useTemplateRef<{ show(): void; hide(): void }>('confirmation');

function name(person: { id: number; name: string | null } | null) {
  return person ? (person.name ?? '#' + person.id) : '';
}

function validator(side: AccountRemovalSide) {
  return side === 'topoguide' ? props.removal.topoguide_validated_by : props.removal.forum_validated_by;
}

function validatedAt(side: AccountRemovalSide) {
  return side === 'topoguide' ? props.removal.topoguide_validated_at : props.removal.forum_validated_at;
}

function actionLabel(name: string, side?: string) {
  const sideLabel = side === 'forum' ? $gettext('forum') : side === 'topoguide' ? $gettext('topoguide') : '';
  const labels: Record<string, string> = {
    create: $gettext('Request created'),
    validate: $gettext('Validated'),
    unvalidate: $gettext('Validation withdrawn'),
    update: $gettext('Forum discussion changed'),
    cancel: $gettext('Cancelled'),
    done: $gettext('Account removed'),
  };
  return (labels[name] ?? name) + (sideLabel ? ` (${sideLabel})` : '');
}

// what the script did: the forum and topoguide outcomes, the documents of a spammer deleted for good
function doneDetails(event: Record<string, unknown>) {
  const parts = [`${$gettext('forum')}: ${event.forum}`, `${$gettext('topoguide')}: ${event.topoguide}`];
  if (Array.isArray(event.documents)) {
    parts.push(`${$gettext('documents deleted:')} ${event.documents.length}`);
  }
  return parts.join(' · ');
}

function changed(request: ApiData<AccountRemoval>) {
  sending.value = true;
  request.then(
    (response) => {
      sending.value = false;
      emit('changed', response.data);
    },
    () => (sending.value = false)
  );
  return request;
}

function validate(side: AccountRemovalSide) {
  changed(c2c.moderator.validateAccountRemoval(props.removal.id, side));
}

function saveUrl() {
  changed(c2c.moderator.updateAccountRemoval(props.removal.id, forumUrl.value.trim()));
}

function ask(name: Action, side: AccountRemovalSide = 'topoguide') {
  action.value = name;
  actionSide.value = side;
  actionUrl.value = '';
  confirmation.value!.show();
}

function confirm() {
  const url = actionUrl.value.trim() || undefined;
  pending.value = changed(
    action.value === 'cancel'
      ? c2c.moderator.cancelAccountRemoval(props.removal.id, url)
      : c2c.moderator.unvalidateAccountRemoval(props.removal.id, actionSide.value, url)
  );
  pending.value.then(() => confirmation.value?.hide());
}
</script>

<style scoped>
.validation {
  height: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px dashed var(--c2c-grey-lighter);
  border-radius: var(--c2c-radius);
}

.validation.is-validated {
  border-style: solid;
  border-color: var(--c2c-green);
}
</style>
