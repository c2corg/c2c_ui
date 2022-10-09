<template>
  <div v-if="version" class="notification is-warning has-text-centered">
    <!-- TODO : translation -->
    <p>
      <span v-translate>This is an archived version of this page, as of</span> {{ $dateUtils.toLocalizedString(version.written_at, 'PPPPpp') }}
    </p>
    <p v-if="version.masked" v-translate>
      This version has been masked.
    </p>

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
    <document-link :document="document" :lang="$route.params.lang" v-translate> see actual version </document-link>
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
      <button
        v-if="!isLastVersion"
        @click="$refs.restoreVersionConfirmationWindow.show()"
        class="button is-primary"
        v-translate
      >
        Restore this version
      </button>
    </p>

    <revert-version-window ref="restoreVersionConfirmationWindow" :document="document" :lang="document.cooked.lang" />
  </div>
</template>

<script>
import RevertVersionWindow from './windows/RevertVersionWindow';

import { requireDocumentProperty } from '@/js/properties-mixins';

export default {
  components: { RevertVersionWindow },

  mixins: [requireDocumentProperty],

  props: {
    version: {
      type: Object,
      default: null,
    },
  },

  computed: {
    isFirstVersion() {
      return this.version.previous_version_id === null;
    },
    isLastVersion() {
      return this.version.next_version_id === null;
    },
  },
};
</script>
