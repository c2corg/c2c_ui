<template>
  <modal-card ref="modalWindow">
    <template #title>
      <span v-translate>Remove this account</span>
    </template>

    <section>
      <div class="notification is-warning has-text-centered has-text-weight-bold" v-translate>
        Warning: once validated by a moderator of the topoguide and by a moderator of the forum, the account is merged
        into the target account, and this cannot be undone!
      </div>

      <div class="field">
        <label class="label" for="removal-reason" v-translate>Reason of the request</label>
        <div class="control">
          <div class="select is-fullwidth">
            <select id="removal-reason" v-model="reason">
              <option value="anonymization" v-translate>The user asks for the anonymization of the account</option>
              <option value="merge" v-translate>The user asks for the merge with another of the accounts</option>
              <option value="spam" v-translate>Spam: the contributions are deleted</option>
            </select>
          </div>
        </div>
      </div>

      <div class="field">
        <label class="label" for="removal-date" v-translate>Date from which the account can be removed</label>
        <div class="control">
          <input id="removal-date" class="input" type="date" v-model="executableAfter" :min="today" />
        </div>
        <p v-if="reason === 'anonymization'" class="help" v-translate>
          A delay of 7 days is expected after the request of the user.
        </p>
      </div>

      <div class="columns">
        <div class="column">
          <div class="field">
            <label class="label" for="removal-target-user" v-translate>Topoguide id to merge into</label>
            <div class="control">
              <input id="removal-target-user" class="input" type="number" min="1" v-model="targetUserId" />
            </div>
          </div>
        </div>
        <div class="column">
          <div class="field">
            <label class="label" for="removal-target-forum" v-translate>Forum id to merge into</label>
            <div class="control">
              <input id="removal-target-forum" class="input" type="number" min="1" v-model="targetForumId" />
            </div>
          </div>
        </div>
      </div>

      <div class="field">
        <label class="label" for="removal-forum-url" v-translate>Forum discussion (optional)</label>
        <div class="control">
          <input id="removal-forum-url" class="input" type="url" v-model="forumUrl" placeholder="https://" />
        </div>
      </div>
    </section>

    <template #footer>
      <footer>
        <button :disabled="!isValid || sending" @click="submit" class="button is-danger" v-translate>
          Request the removal
        </button>
        <button @click="hide()" class="button" v-translate>Cancel</button>
      </footer>
    </template>
  </modal-card>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from 'vue';
import { useRouter } from 'vue-router';

import c2c from '@/js/apis/c2c';
import type { AccountRemovalReason } from '@/js/apis/c2c/ModeratorService';
import { documentProperty } from '@/js/properties';

const props = defineProps({ ...documentProperty });

const router = useRouter();

// the account "Compte fermé", in the topoguide and in the forum
const CLOSED_ACCOUNT_TOPOGUIDE_ID = 811780;
const CLOSED_ACCOUNT_FORUM_ID = 49513;
// delay between the request of the user and the anonymization
const ANONYMIZATION_DELAY_DAYS = 7;

function isoDate(daysFromNow: number) {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().slice(0, 10);
}

const today = isoDate(0);

const reason = ref<AccountRemovalReason>('anonymization');
const executableAfter = ref(isoDate(ANONYMIZATION_DELAY_DAYS));
const targetUserId = ref<number | string>(CLOSED_ACCOUNT_TOPOGUIDE_ID);
const targetForumId = ref<number | string>(CLOSED_ACCOUNT_FORUM_ID);
const forumUrl = ref('');
const sending = ref(false);

const modalWindowRef = useTemplateRef<{ show(): void; hide(): void }>('modalWindow');

// the usual values of each reason
watch(reason, (value) => {
  if (value === 'merge') {
    // the accounts are those of the user
    targetUserId.value = '';
    targetForumId.value = '';
    executableAfter.value = today;
    return;
  }
  targetUserId.value = CLOSED_ACCOUNT_TOPOGUIDE_ID;
  targetForumId.value = CLOSED_ACCOUNT_FORUM_ID;
  executableAfter.value = value === 'anonymization' ? isoDate(ANONYMIZATION_DELAY_DAYS) : today;
});

const isValid = computed(
  () =>
    Boolean(executableAfter.value) &&
    Number(targetUserId.value) > 0 &&
    Number(targetForumId.value) > 0 &&
    Number(targetUserId.value) !== props.document.document_id
);

function hide() {
  modalWindowRef.value!.hide();
}

function show() {
  modalWindowRef.value!.show();
}

function submit() {
  sending.value = true;
  c2c.moderator
    .requestAccountRemoval({
      user_id: props.document.document_id!,
      reason: reason.value,
      executable_after: executableAfter.value,
      target_user_id: Number(targetUserId.value),
      target_forum_id: Number(targetForumId.value),
      ...(forumUrl.value ? { forum_url: forumUrl.value } : {}),
    })
    .then(
      () => {
        sending.value = false;
        hide();
        router.push({ name: 'account-removals' });
      },
      () => {
        // the error is shown by the API client
        sending.value = false;
      }
    );
}

// shown by ToolBox through its template ref
defineExpose({ show });
</script>
