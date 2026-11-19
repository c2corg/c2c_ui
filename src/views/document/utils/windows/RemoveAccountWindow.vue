<template>
  <modal-card ref="modalWindow">
    <template #title>
      <span v-translate>Remove this account</span>
    </template>

    <section>
      <div class="notification is-warning has-text-centered has-text-weight-bold" v-translate>
        Once validated by a moderator of the topoguide and by a moderator of the forum, the account is merged into the
        target account, in the topoguide and in the forum: this cannot be undone.
      </div>

      <div class="field">
        <label class="label" for="removal-reason" v-translate>Reason of the request</label>
        <div class="control">
          <div class="select is-fullwidth">
            <select id="removal-reason" v-model="reason">
              <option value="anonymization" v-translate>The user asks for the anonymization of the account</option>
              <option value="merge" v-translate>The user asks for the merge with another of their accounts</option>
              <option value="spam" v-translate>Spam: its contributions are deleted, its forum account too</option>
            </select>
          </div>
        </div>
      </div>

      <div class="columns">
        <div v-if="reason !== 'spam'" class="column">
          <div class="field">
            <label class="label" for="removal-user-date">
              {{ $gettext('When the user asked for it') }}
              <span v-if="reason !== 'anonymization'" class="has-text-grey has-text-weight-normal">
                ({{ $gettext('optional') }})
              </span>
            </label>
            <input id="removal-user-date" v-model="userRequestDate" class="input" type="date" :max="today" />
          </div>
        </div>
        <div class="column">
          <div class="field">
            <label class="label" for="removal-date" v-translate>Not removed before</label>
            <input id="removal-date" v-model="executableAfter" class="input" type="date" :min="earliest" />
            <p v-if="reason === 'anonymization'" class="help" v-translate>
              7 days after the request of the user at the earliest.
            </p>
          </div>
        </div>
      </div>

      <div class="field">
        <label class="label" v-translate>Merged into</label>
        <input-document v-if="reason === 'merge'" v-model="target" document-type="profile" />
        <p v-else class="has-text-grey" v-translate>
          The closed account ("Compte fermé"), in the topoguide and in the forum.
        </p>
        <p v-if="reason === 'merge'" class="help" v-translate>
          The other account of the user: its forum account is found by the API.
        </p>
      </div>

      <div class="field">
        <label class="label" for="removal-forum-url">
          {{ $gettext('Forum discussion') }}
          <span class="has-text-grey has-text-weight-normal">({{ $gettext('optional') }})</span>
        </label>
        <input id="removal-forum-url" v-model="forumUrl" class="input" type="url" placeholder="https://" />
      </div>

      <div v-if="error" class="notification is-danger">{{ error }}</div>
    </section>

    <template #footer>
      <footer>
        <button
          :disabled="!isValid"
          :class="{ 'is-loading': sending }"
          class="button is-danger"
          @click="submit"
          v-translate
        >
          Request the removal
        </button>
        <button class="button" @click="hide()" v-translate>Cancel</button>
      </footer>
    </template>
  </modal-card>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from 'vue';
import { useRouter } from 'vue-router';

import c2c from '@/js/apis/c2c';
import { apiErrors } from '@/js/apis/c2c/api-errors';
import type { AccountRemovalReason } from '@/js/apis/c2c/schemas';
import { useGlobalProperties } from '@/js/composables/global-properties';
import { documentProperty } from '@/js/properties';

const props = defineProps({ ...documentProperty });

const router = useRouter();
const { $gettext } = useGlobalProperties();

// the API checks it too
const ANONYMIZATION_DELAY_DAYS = 7;

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(day: string, days: number) {
  const date = new Date(day + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + days);
  return isoDate(date);
}

const today = isoDate(new Date());

const reason = ref<AccountRemovalReason>('anonymization');
const userRequestDate = ref(today);
const executableAfter = ref(addDays(today, ANONYMIZATION_DELAY_DAYS));
const target = ref<{ document_id: number } | null>(null);
const forumUrl = ref('');
const sending = ref(false);
const error = ref('');

// an anonymization waits 7 days after the request of the user
const earliest = computed(() =>
  reason.value === 'anonymization' && userRequestDate.value
    ? addDays(userRequestDate.value, ANONYMIZATION_DELAY_DAYS)
    : today
);

watch(earliest, (value) => {
  if (executableAfter.value < value) {
    executableAfter.value = value;
  }
});
watch(reason, (value) => {
  if (value !== 'anonymization') {
    executableAfter.value = today;
  }
});

const isValid = computed(
  () =>
    !sending.value &&
    executableAfter.value >= earliest.value &&
    (reason.value !== 'anonymization' || Boolean(userRequestDate.value)) &&
    (reason.value !== 'merge' || (target.value !== null && target.value.document_id !== props.document.document_id))
);

const modalWindowRef = useTemplateRef<{ show(): void; hide(): void }>('modalWindow');

function hide() {
  modalWindowRef.value!.hide();
}

function show() {
  error.value = '';
  modalWindowRef.value!.show();
}

function submit() {
  sending.value = true;
  error.value = '';
  c2c.moderator
    .requestAccountRemoval({
      user_id: Number(props.document.document_id),
      reason: reason.value,
      executable_after: executableAfter.value,
      ...(reason.value !== 'spam' && userRequestDate.value ? { user_request_date: userRequestDate.value } : {}),
      ...(reason.value === 'merge' && target.value ? { target_user_id: target.value.document_id } : {}),
      ...(forumUrl.value.trim() ? { forum_url: forumUrl.value.trim() } : {}),
    })
    .then(
      () => {
        sending.value = false;
        hide();
        router.push({ name: 'moderation', params: { tab: 'accounts' } });
      },
      (e: unknown) => {
        sending.value = false;
        error.value = apiErrors(e)
          .map((item) => $gettext(item.description, 'API message'))
          .join(' ');
      }
    );
}

defineExpose({ show });
</script>
