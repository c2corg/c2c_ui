<template>
  <div v-if="version" class="notification is-warning has-text-centered">
    <p>
      <span v-translate>This is an archived version of this page, as of</span>
      {{ $dateUtils.toLocalizedString(version.written_at, 'LLLL') }}
    </p>
    <p v-if="version.masked" v-translate>This version has been masked.</p>

    <span v-if="!isFirstVersion">
      (<diff-link
        :document-type="documentType"
        :id="document.document_id"
        :lang="$route.params.lang"
        :version-from="version.previous_version_id"
        :version-to="$route.params.version"
      />)
      <version-link
        :document-type="documentType"
        :id="document.document_id"
        :lang="$route.params.lang"
        :version="version.previous_version_id"
      >
        ←
        <span v-translate>previous version</span>
      </version-link>
    </span>
    <span v-else v-translate>This is the first version</span>
    |
    <document-link :document="document" :lang="$route.params.lang" v-translate>see actual version</document-link>
    (<diff-link
      :document-type="documentType"
      :id="document.document_id"
      :lang="$route.params.lang"
      :version-from="$route.params.version"
      version-to="last"
    />) |
    <span v-if="!isLastVersion">
      <version-link
        :document-type="documentType"
        :id="document.document_id"
        :lang="$route.params.lang"
        :version="version.next_version_id"
      >
        <span v-translate>next version</span>
        →
      </version-link>
      (<diff-link
        :document-type="documentType"
        :id="document.document_id"
        :lang="$route.params.lang"
        :version-to="version.next_version_id"
        :version-from="$route.params.version"
      />)
    </span>
    <span v-else v-translate>This is the last version</span>

    <p>
      <icon-document document-type="profile" />
      <contributor-link :contributor="version" /> : <em>{{ version.comment }}</em>
    </p>
    <p v-if="$user.isModerator">
      <button v-if="!isLastVersion" @click="restoreWindow?.show()" class="button is-primary" v-translate>
        Restore this version
      </button>
    </p>

    <revert-version-window ref="restoreWindow" :document="document" :lang="document.cooked.lang" />
  </div>
</template>

<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';

import RevertVersionWindow from './windows/RevertVersionWindow.vue';

import { documentProperty, useDocumentType } from '@/js/properties';

const props = defineProps({
  ...documentProperty,
  version: {
    type: Object,
    default: null,
  },
});

const { documentType } = useDocumentType(props);

const restoreWindow = useTemplateRef<InstanceType<typeof RevertVersionWindow>>('restoreWindow');

const isFirstVersion = computed(() => !props.version.previous_version_id);

const isLastVersion = computed(() => !props.version.next_version_id);
</script>
