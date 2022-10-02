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
        :version-from="versionFrom"
        :version-to="versionTo"
      />

      <table class="table is-striped">
        <thead>
          <tr>
            <th />
            <th v-translate>Created on</th>
            <th v-translate>contributor</th>
            <th v-translate>comment</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="version of history.versions" :key="version.version_id">
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
                  v-if="version.version_id !== veryFirstVersionId"
                  :document-type="documentType"
                  :id="documentId"
                  :lang="lang"
                  version-from="prev"
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
            <td>
              <mask-link
                v-if="version.version_id !== veryFirstVersionId"
                :id="documentId"
                :version="version"
                :lang="lang"
              />
              {{ version.comment }}
            </td>
          </tr>
        </tbody>
      </table>

      <history-view-links
        :document-id="documentId"
        :document-type="documentType"
        :lang="lang"
        :version-from="versionFrom"
        :version-to="versionTo"
      />
    </div>
  </div>
</template>

<script>
import HistoryViewLinks from './utils/HistoryViewLinks';

import c2c from '@/js/apis/c2c';
import noRobotsMixin from '@/js/no-robots-mixin';

export default {
  components: { HistoryViewLinks },

  mixins: [noRobotsMixin],

  data() {
    return {
      // theese three data are computed
      promise: {},
      versionFrom: undefined,
      versionTo: undefined,
    };
  },

  computed: {
    documentId() {
      return parseInt(this.$route.params.id);
    },
    documentType() {
      return this.$route.name.replace('-history', '');
    },
    lang() {
      return this.$route.params.lang;
    },
    veryFirstVersionId() {
      return this.history.versions[this.history.versions.length - 1].version_id;
    },
    history() {
      return this.promise.data;
    },
  },

  watch: {
    $route: {
      handler: 'load',
      immediate: true,
    },
  },

  methods: {
    load() {
      this.promise = c2c[this.documentType].getHistory(this.documentId, this.lang).then((response) => {
        const versions = response.data.versions.reverse();
        response.data.versions = versions;

        this.versionFrom = versions[versions.length > 1 ? 1 : 0].version_id;
        this.versionTo = versions[0].version_id;
      });
    },
  },
};
</script>

<style scoped lang="scss">
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
