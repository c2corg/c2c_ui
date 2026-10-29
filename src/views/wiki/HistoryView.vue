<template>
  <div class="section">
    <html-header :title="$gettext('Versions')" />

    <loading-notification :promise="promise" />

    <div v-if="history">
      <h1 class="title is-1">
        <icon-document :document-type="documentType" />
        <router-link :to="{ name: documentType, params: { id: documentId, lang: lang } }">{{
          history.title
        }}</router-link>
      </h1>

      <history-view-links
        :document-id="documentId"
        :document-type="documentType"
        :lang="lang"
        :version-from="versionFrom!"
        :version-to="versionTo!"
      />

      <table class="table is-striped">
        <thead>
          <tr>
            <th />
            <th v-translate>Created on</th>
            <th v-translate>Contributor</th>
            <th v-translate v-if="$user.isModerator">Visibility</th>
            <th v-translate>comment</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="version of filteredVersions" :key="version.version_id" :class="{ masked: version.masked }">
            <td>
              <div v-if="documentType != 'profile'" class="control">
                <input
                  v-model="versionFrom"
                  :disabled="versionTo <= version.version_id"
                  :value="version.version_id"
                  type="radio"
                  name="versionFrom"
                />
                <input
                  v-model="versionTo"
                  :disabled="versionFrom >= version.version_id"
                  :value="version.version_id"
                  type="radio"
                  name="versionTo"
                />
                <diff-link
                  v-if="version.previous_version_id"
                  :document-type="documentType"
                  :id="documentId"
                  :lang="lang"
                  :version-from="version.previous_version_id"
                  :version-to="version.version_id"
                />
              </div>
            </td>
            <td>
              <version-link :document-type="documentType" :id="documentId" :version="version.version_id" :lang="lang">
                {{ $dateUtils.toTechnicalString(version.written_at) }}
              </version-link>
            </td>
            <td>
              <contributor-link :contributor="version" />
            </td>
            <td v-if="$user.isModerator">
              <mask-link
                v-if="version.version_id !== latestVersionId"
                :id="documentId"
                :version="version"
                :lang="lang"
              />
            </td>
            <td>
              {{ version.comment }}
            </td>
          </tr>
        </tbody>
      </table>

      <history-view-links
        :document-id="documentId"
        :document-type="documentType"
        :lang="lang"
        :version-from="versionFrom!"
        :version-to="versionTo!"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

import HistoryViewLinks from './utils/HistoryViewLinks.vue';

import type { ApiData } from '@/js/apis/BaseApi';
import c2c from '@/js/apis/c2c';
import type DocumentService from '@/js/apis/c2c/DocumentService';
import { useGlobalProperties } from '@/js/composables/global-properties';
import { useNoRobots } from '@/js/composables/head';

useNoRobots();

const route = useRoute();
const { $user } = useGlobalProperties();

// a version of the document, as the history lists them
type Version = {
  version_id: number;
  masked?: boolean;
  previous_version_id?: number;
  written_at: string;
  [property: string]: unknown;
};

// theese three data are computed
const promise = ref<ApiData | { data?: undefined }>({});
const versionFrom = ref<number | undefined>(undefined);
const versionTo = ref<number | undefined>(undefined);

const documentId = computed(() => parseInt(String(route.params.id)));
const documentType = computed(() => String(route.name).replace('-history', ''));
const lang = computed(() => String(route.params.lang));
const history = computed(() => promise.value.data as { title: string; versions: Version[] } | undefined);
const latestVersionId = computed(() => history.value!.versions[0].version_id);

const filteredVersions = computed(() => {
  let versions = [...history.value!.versions];
  if (!$user.isModerator) {
    versions = versions.filter((version) => !version.masked);
  }

  const l = versions.length;
  versions.forEach((version, i) => {
    if (i < l - 1) {
      version.previous_version_id = versions[i + 1].version_id;
    }
  });

  return versions;
});

function load() {
  promise.value = (c2c[documentType.value] as DocumentService)
    .getHistory(documentId.value, lang.value)
    .then((response) => {
      const versions = (response.data.versions as Version[]).reverse();
      response.data.versions = versions;

      versionFrom.value = versions[versions.length > 1 ? 1 : 0].version_id;
      versionTo.value = versions[0].version_id;
    });
}

watch(() => route.fullPath, load, { immediate: true });
</script>

<style scoped lang="scss">
tr.masked {
  background: repeating-linear-gradient(
    45deg,
    rgba(0, 0, 0, 0.05),
    rgba(0, 0, 0, 0.05) 10px,
    rgba(0, 0, 0, 0) 10px,
    rgba(0, 0, 0, 0) 20px
  );
  background-attachment: scroll;
}

td {
  white-space: nowrap;
}

td:nth-child(4) {
  width: 100%;
  white-space: normal;
  font-style: italic;
}
input[type='radio'] {
  margin-right: 5px;
}
</style>
