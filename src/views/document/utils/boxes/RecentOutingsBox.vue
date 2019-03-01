<template>
  <div class="box no-print" v-if="documentType=='route' || outings.length !== 0">
    <div class="title is-2">
      <span v-translate>Last outings</span>
      <span v-if="outings.length !== 0 && !hideSeeAllResultsButton">
        <span>, </span>
        <router-link
          :to="{name:'outings', query:query}"
          class="is-size-5"
          v-translate>
          show all
        </router-link>
      </span>
    </div>

    <div v-for="(outing, i) of outings" :key="i">
      <pretty-outing-link :outing="outing"/>
    </div>

    <div v-if="documentType=='route'" class="has-text-centered add-section">
      <add-link
        document-type="outing"
        :query="query"
        class="button is-primary">
        <span v-if="outings.length === 0" v-translate>
          Add the first outing
        </span>
      </add-link>
    </div>

  </div>
</template>

<script>
  import { requireDocumentProperty } from '@/js/properties-mixins';

  export default {
    mixins: [ requireDocumentProperty ],

    props: {
      hideSeeAllResultsButton: {
        type: Boolean,
        default: false
      }
    },

    computed: {
      // API bug, an outing can be present several times
      outings() {
        const result = new Map();
        const associations = this.document.associations;
        let outings = [];

        if (associations.recent_outings !== undefined) {
          outings = associations.recent_outings.documents;
        } else {
          outings = associations.outings;
        }

        for (const outing of outings) {
          result.set(outing.document_id, outing);
        }

        return [...result.values()];
      },

      query() {
        const query = {};
        query[this.document.type] = this.document.document_id;
        return query;
      }
    }
  };
</script>

<style scoped>
  .button{
    vertical-align: bottom;
    margin-left: 1rem;
  }

  .add-section{
    margin-top: 1.5rem;
  }
</style>
