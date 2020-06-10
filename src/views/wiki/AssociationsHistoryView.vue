<template>
  <div class="section">
    <html-header :title="$gettext('Associations history')" />

    <association-history-pagination
      :count="results ? results.count : 0"
      :limit="limit"
      :offset="offset"
      :document-id="documentId"
      :user-id="userId"
    />

    <loading-notification :promise="promise" />

    <table v-if="results" class="table is-striped">
      <thead>
        <tr>
          <th v-translate>Created on</th>
          <th v-translate>Contributor</th>
          <th v-translate>Creation?</th>
          <th v-translate>Parent</th>
          <th v-translate>Child</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(association, i) of results.associations" :key="i">
          <td>
            {{ $moment.toTechnicalString(association.written_at) }}
          </td>
          <td>
            <contributor-link :contributor="association.user" />
          </td>
          <td>
            {{ association.is_creation }}
          </td>
          <td>
            <colored-icon-document :document-type="$documentUtils.getDocumentType(association.parent_document.type)" />
            <span>&nbsp;</span>
            <document-link :document="association.parent_document" />
          </td>
          <td>
            <colored-icon-document :document-type="$documentUtils.getDocumentType(association.child_document.type)" />
            <span>&nbsp;</span>
            <document-link :document="association.child_document" />
          </td>
        </tr>
      </tbody>
    </table>
    <association-history-pagination
      :count="results ? results.count : 0"
      :limit="limit"
      :offset="offset"
      :document-id="documentId"
      :user-id="userId"
    />
  </div>
</template>

<script>
import AssociationHistoryPagination from './utils/AssociationHistoryPagination';
import ColoredIconDocument from './utils/ColoredIconDocument';
import c2c from '@/js/apis/c2c';

export default {
  components: { ColoredIconDocument, AssociationHistoryPagination },

  data() {
    return {
      promise: {},
    };
  },

  computed: {
    userId() {
      return this.$route.query.u ? parseInt(this.$route.query.u) : null;
    },
    documentId() {
      return this.$route.query.d ? parseInt(this.$route.query.d) : null;
    },
    offset() {
      return this.$route.query.offset ? parseInt(this.$route.query.offset) : null;
    },
    limit() {
      return this.$route.query.limit ? parseInt(this.$route.query.limit) : null;
    },
    results() {
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
      this.promise = c2c.association.getHistory({
        documentId: this.documentId,
        userId: this.userId,
        limit: this.limit,
        offset: this.offset,
      });
    },
  },
};
</script>

<style scoped>
td:nth-child(1),
td:nth-child(2) {
  white-space: nowrap;
}
</style>
