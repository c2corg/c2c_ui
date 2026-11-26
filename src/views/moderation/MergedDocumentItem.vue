<template>
  <div class="box">
    <div class="is-flex is-justify-content-space-between is-align-items-start">
      <div>
        <p class="is-size-5">
          <icon-document :document-type="documentType" fixed-width />
          <span class="tag is-link is-light mr-2" v-translate>merged</span>
          <!-- the source redirects to the target: no page of its own -->
          <span>{{ title }}</span>
          <fa-icon icon="arrow-right" class="mx-2 has-text-grey" />
          <router-link :to="documentRoute(merge.document_type, merge.target_document_id)">
            {{ targetTitle }}
          </router-link>
        </p>

        <p v-if="countTexts.length" class="mt-1">{{ countTexts.join(' · ') }}</p>

        <p v-if="merge.earlier_merges.length" class="mt-1 earlier-merges">
          <fa-icon icon="link" class="mr-1 has-text-grey" />
          {{ $gettext('Merged into it before, to undo after this one:') }} {{ earlierTitles }}
        </p>

        <p class="mt-1 is-size-7">
          <template v-if="merge.author">
            <span v-translate>Written by</span>
            <contributor-link :contributor="merge.author" />
            <br />
          </template>
          <span v-translate>Merged</span>
          <template v-if="merge.deleted_by">
            <span v-translate>by</span>
            <contributor-link :contributor="merge.deleted_by" />
          </template>
          {{ $dateUtils.toLocalizedString(merge.deleted_at, 'lll') }}
          <span class="has-text-grey">· {{ $gettext('days left to undo it:') }} {{ days }}</span>
        </p>
      </div>

      <div class="buttons is-flex-shrink-0 ml-3">
        <button class="button is-primary" @click="confirmation!.show()">
          <fa-icon icon="history" class="mr-1" />
          <span v-translate>Undo the merge</span>
        </button>
      </div>
    </div>

    <!-- an undo destroys nothing: not the red and green of the deletions -->
    <modal-confirmation
      ref="confirmation"
      :promise="unmerging"
      confirm-class="is-primary"
      cancel-class=""
      @confirm="unmerge"
    >
      <template #title>
        <span v-translate>Undo this merge</span>
      </template>
      <p>
        <strong>{{ title }}</strong>
        <fa-icon icon="arrow-right" class="mx-2" />
        <strong>{{ targetTitle }}</strong>
      </p>
      <p class="mt-2" v-translate>
        The merged document comes back with its associations, favourites and the routes it was the main waypoint of.
        What was changed on the other document since the merge stays with it.
      </p>
      <template #confirm-label>
        <span v-translate>Undo the merge</span>
      </template>
    </modal-confirmation>
  </div>
</template>

<script setup lang="ts">
import { computed, shallowRef, useTemplateRef, type PropType } from 'vue';

import { daysLeft, documentRoute } from './deleted-documents';

import type { ApiData } from '@/js/apis/BaseApi';
import c2c from '@/js/apis/c2c';
import type { MergedDocument, UnmergeResult } from '@/js/apis/c2c/schemas';
import { useGlobalProperties } from '@/js/composables/global-properties';
import constants from '@/js/constants';

const props = defineProps({
  merge: {
    type: Object as PropType<MergedDocument>,
    required: true,
  },
});

const emit = defineEmits<{ unmerged: [result: UnmergeResult] }>();

const confirmation = useTemplateRef<{ show(): void; hide(): void }>('confirmation');
const unmerging = shallowRef<ApiData<UnmergeResult> | null>(null);

const { $gettext } = useGlobalProperties();

const documentType = computed(() => constants.letterToDocumentType[props.merge.document_type]);
const title = computed(() => props.merge.title || '#' + props.merge.document_id);
const targetTitle = computed(() => props.merge.target_title || '#' + props.merge.target_document_id);
const days = computed(() => daysLeft(props.merge.expires_at));
const earlierTitles = computed(() =>
  props.merge.earlier_merges.map((earlier) => earlier.title || '#' + earlier.document_id).join(', ')
);

// what the merge moved, the numbers next to their labels (no parameters in the translations)
const countTexts = computed(() => {
  const counts = props.merge.counts;
  const labels: [string, string][] = [
    ['associations_moved', $gettext('links moved:')],
    ['associations_removed', $gettext('links already on the other document:')],
    ['favourites_moved', $gettext('favourites moved:')],
    ['routes', $gettext('routes of this main waypoint:')],
    ['redirected', $gettext('documents merged into it before:')],
    ['files', $gettext('image files:')],
  ];
  return labels.filter(([name]) => counts[name]).map(([name, label]) => `${label} ${counts[name]}`);
});

function unmerge() {
  unmerging.value = c2c.moderator.unmergeDocument(props.merge.id).then((response) => {
    confirmation.value!.hide();
    emit('unmerged', response.data);
  });
}
</script>
