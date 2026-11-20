<template>
  <div class="content is-small">
    <div v-if="!details || details.loading" class="button is-loading is-white" />
    <div v-else-if="details.error" class="notification is-danger" v-translate>The details could not be loaded.</div>
    <div v-else-if="details.data" class="columns is-multiline">
      <div class="column is-6">
        <p>
          <strong v-translate>Languages</strong>
          <br />
          <span v-for="locale of details.data.locales" :key="locale.lang" class="mr-3">
            <span class="tag">{{ locale.lang }}</span>
            {{ locale.title }}
          </span>
        </p>
        <p>
          <strong v-translate>History</strong>
          <br />
          <span class="with-colon">{{ $gettext('Versions') }}</span> {{ details.data.versions }}
          <template v-if="details.data.last_edited_by">
            ·
            <span v-translate>last edited by</span>
            <contributor-link :contributor="details.data.last_edited_by" />
            <span v-if="details.data.last_edited_at">
              , {{ $dateUtils.toLocalizedString(details.data.last_edited_at, 'll') }}
            </span>
          </template>
          <br />
          <span v-translate>Contributors:</span>
          <span v-for="(contributor, i) of details.data.contributors" :key="contributor.user_id">
            <span v-if="i">, </span>
            <contributor-link :contributor="contributor" />
          </span>
        </p>
        <p v-if="details.data.topics.length">
          <strong v-translate>Comments</strong>
          <br />
          <a
            v-for="topic of details.data.topics"
            :key="topic.topic_id"
            :href="forumUrl + '/t/' + topic.topic_id"
            class="mr-3"
          >
            <icon-forum />
            {{ topic.lang }}
          </a>
        </p>
        <p v-if="details.data.deleted_images?.length">
          <strong v-translate>Images deleted with it, restored with it</strong>
          <br />
          <span v-for="image of details.data.deleted_images" :key="image.document_id" class="mr-3">
            #{{ image.document_id }} {{ image.title }}
          </span>
        </p>
        <p v-if="details.data.merged_document_ids.length">
          <strong v-translate>Merged documents, restored with it</strong>
          <br />
          {{ details.data.merged_document_ids.map((id) => '#' + id).join(', ') }}
        </p>
      </div>

      <div class="column is-6">
        <p>
          <strong v-translate>Linked documents</strong>
          <br />
          <span v-if="!details.data.associations.length" class="has-text-grey" v-translate>None</span>
          <span v-for="link of details.data.associations" :key="link.document_id" class="is-block">
            <icon-document :document-type="letterToDocumentType[link.document_type]" fixed-width />
            <router-link v-if="link.exists" :to="documentRoute(link.document_type, link.document_id)">
              {{ link.title || '#' + link.document_id }}
            </router-link>
            <span v-else class="has-text-grey">
              <s>#{{ link.document_id }}</s>
              <span v-translate>deleted since: this link will not be restored</span>
            </span>
          </span>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';

import { documentRoute } from './deleted-documents';

import type { ApiData } from '@/js/apis/BaseApi';
import type { DeletedDocumentDetails } from '@/js/apis/c2c/schemas';
import config from '@/js/config';
import constants from '@/js/constants';

defineProps({
  details: {
    type: Object as PropType<ApiData<DeletedDocumentDetails> | null>,
    default: null,
  },
});

const forumUrl = config.urls.forum;
const { letterToDocumentType } = constants;
</script>
