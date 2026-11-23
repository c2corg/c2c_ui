<template>
  <div class="box">
    <div class="is-flex is-justify-content-space-between is-align-items-start">
      <div>
        <p class="is-size-5">
          <icon-document :document-type="documentType" fixed-width />
          <!-- a deleted locale: its document is still there -->
          <router-link v-if="document.lang" :to="documentRoute(document.document_type, document.document_id)">
            {{ title }}
          </router-link>
          <span v-else>{{ title }}</span>
          <span v-if="document.lang" class="tag is-warning ml-2">
            {{ $gettext('deleted locale:') }}&nbsp;{{ document.lang }}
          </span>
          <span v-if="document.deleted_images" class="tag is-info is-light ml-2">
            <fa-icon icon="image" class="mr-1" />
            {{ $gettext('images deleted with it:') }}&nbsp;{{ document.deleted_images }}
          </span>
        </p>

        <p class="mt-1">
          <icon-activity v-for="activity of activities" :key="activity" :activity="activity" />
          <span v-for="(text, i) of fieldTexts" :key="i">{{ i || activities.length ? ' · ' : '' }}{{ text }}</span>
        </p>

        <p class="mt-1 is-size-7">
          <template v-if="document.author">
            <span v-translate>Written by</span>
            <contributor-link :contributor="document.author" /><span v-if="document.created_at"
              >, {{ $dateUtils.toLocalizedString(document.created_at, 'll') }}</span
            >
            <br />
          </template>
          <span v-translate>Deleted</span>
          <template v-if="document.deleted_by">
            <span v-translate>by</span>
            <contributor-link :contributor="document.deleted_by" />
            <span v-if="selfDeleted" class="tag is-light ml-1" v-translate>its author</span>
          </template>
          {{ $dateUtils.toLocalizedString(document.deleted_at, 'lll') }}
          <span class="has-text-grey">· {{ $gettext('days left to restore it:') }} {{ days }}</span>
        </p>
      </div>

      <div class="buttons is-flex-shrink-0 ml-3">
        <button class="button" @click="toggleDetails">
          <fa-icon :icon="showDetails ? 'chevron-up' : 'chevron-down'" class="mr-1" />
          <span v-translate>Details</span>
        </button>
        <button class="button is-primary" @click="confirmRestore">
          <fa-icon icon="history" class="mr-1" />
          <span v-translate>Restore</span>
        </button>
      </div>
    </div>

    <deleted-document-details v-if="showDetails" :details="details" class="mt-4" />

    <!-- a restore destroys nothing: not the red and green of the deletions -->
    <modal-confirmation
      ref="confirmation"
      :promise="restoring"
      confirm-class="is-primary"
      cancel-class=""
      @confirm="restore"
    >
      <template #title>
        <span v-translate>Restore this document</span>
      </template>
      <p>
        <strong>{{ title }}</strong>
      </p>
      <p class="mt-2" v-translate>
        It comes back with its history, associations and comments, as it was when deleted. The links to documents
        deleted since are not restored.
      </p>
      <p v-if="document.deleted_images" class="mt-2">
        {{ $gettext('The images deleted with it are restored too:') }} {{ document.deleted_images }}
      </p>
      <template #confirm-label>
        <span v-translate>Restore</span>
      </template>
    </modal-confirmation>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, shallowRef, useTemplateRef, type PropType } from 'vue';

import DeletedDocumentDetails from './DeletedDocumentDetails.vue';
import { DATE_FIELDS, ELEVATION_FIELDS, daysLeft, documentRoute } from './deleted-documents';

import type { ApiData } from '@/js/apis/BaseApi';
import c2c from '@/js/apis/c2c';
import type { DeletedDocument, DeletedDocumentDetails as Details, RestoreResult } from '@/js/apis/c2c/schemas';
import { useGlobalProperties } from '@/js/composables/global-properties';
import constants from '@/js/constants';
import { formatNumber } from '@/js/length-format';

const props = defineProps({
  document: {
    type: Object as PropType<DeletedDocument>,
    required: true,
  },
});

const emit = defineEmits<{ restored: [result: RestoreResult] }>();

const confirmation = useTemplateRef<{ show(): void; hide(): void }>('confirmation');

const showDetails = ref(false);
// ApiData is reactive itself: kept as is, not unwrapped
const details = shallowRef<ApiData<Details> | null>(null);
const restoring = shallowRef<ApiData<RestoreResult> | null>(null);

const documentType = computed(() => constants.letterToDocumentType[props.document.document_type]);
const title = computed(() => props.document.title || '#' + props.document.document_id);
const { $gettext, $dateUtils, $language } = useGlobalProperties();

const fields = computed(() => props.document.fields as Record<string, unknown>);
const activities = computed(() =>
  Array.isArray(fields.value.activities) ? (fields.value.activities as string[]) : []
);

// the other fields, as text: the dates formatted, a one-day outing with one date
const fieldTexts = computed(() =>
  Object.entries(fields.value).flatMap(([name, value]) => {
    if (name === 'activities' || value === null || value === undefined || value === '') {
      return [];
    }
    if (name === 'date_end' && value === fields.value.date_start) {
      return [];
    }
    if (DATE_FIELDS.has(name)) {
      return [$dateUtils.toLocalizedString(value as string, 'll')];
    }
    if (ELEVATION_FIELDS.has(name)) {
      return [`${formatNumber(value as number, $language?.current)} m`];
    }
    if (Array.isArray(value)) {
      return [value.map((v) => $gettext(String(v))).join(', ')];
    }
    return [$gettext(String(value))];
  })
);
const days = computed(() => daysLeft(props.document.expires_at));
const selfDeleted = computed(
  () => !!props.document.author && props.document.author.user_id === props.document.deleted_by?.user_id
);

function toggleDetails() {
  showDetails.value = !showDetails.value;
  if (showDetails.value && !details.value) {
    details.value = c2c.moderator.getDeletedDocument(props.document.id);
  }
}

function confirmRestore() {
  confirmation.value!.show();
}

function restore() {
  restoring.value = c2c.moderator.restoreDeletedDocument(props.document.id).then((response) => {
    confirmation.value!.hide();
    emit('restored', response.data);
  });
}
</script>
