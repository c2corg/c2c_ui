<template>
  <modal-card ref="modalWindow">
    <span slot="title">
      <span v-translate>Merge documents</span>
    </span>

    <section>
      <div class="notification is-warning has-text-centered has-text-weight-bold" v-translate>
        Warning: This action cannot be undone!
      </div>
      <div class="has-padding-bottom">
        <span v-translate>
          Merging a source document with a target document transfers all associations of the source document to the
          target document, and sets up a redirection from the source to the target document.
        </span>
        <span>&nbsp;</span>
        <span class="has-text-weight-bold" v-translate>
          Note that comments have to be transferred manually in Discourse before merging.
        </span>
      </div>

      <div class="has-padding-bottom">
        <div class="has-text-weight-bold" v-translate>Source:</div>
        <fa-icon icon="check-circle" class="has-text-success" />
        <merge-document-link :document="document" />
      </div>

      <div class="has-padding-bottom">
        <div>
          <span class="has-text-weight-bold" v-translate>Target:</span>
          <input-document
            :document-type="documentType"
            v-model="targetDocument"
            :show-options="false"
            @load-options="options = arguments[0]"
            is-small
          />
        </div>
        <div v-if="targetDocument">
          <fa-icon icon="check-circle" class="has-text-success" />
          <merge-document-link :document="targetDocument" />
        </div>
      </div>

      <div v-for="target of possibleTargets" :key="target.documentId" class="columns is-mobile is-variable is-1">
        <div class="column">
          <merge-document-link :document="target" />
        </div>
        <div class="column is-narrow">
          <button class="button is-success is-small" @click="select(target)">select</button>
        </div>
      </div>
    </section>

    <footer slot="footer">
      <button :disabled="targetDocument === null" @click="mergeDocuments" class="button is-success" v-translate>
        Merge documents
      </button>
      <button @click="hide()" class="button" v-translate>
        Cancel
      </button>
    </footer>
  </modal-card>
</template>

<script>
import MergeDocumentLink from './MergeDocumentLink';
import c2c from '@/js/apis/c2c';
import { requireDocumentProperty } from '@/js/properties-mixins';

export default {
  components: { MergeDocumentLink },

  mixins: [requireDocumentProperty],

  data() {
    return {
      targetDocument: null,
      options: null,
    };
  },

  computed: {
    possibleTargets() {
      if (this.options) {
        return this.options[this.documentType + 's'].documents;
      } else {
        return [];
      }
    },
  },

  methods: {
    hide() {
      this.$refs.modalWindow.hide();
    },
    show() {
      this.$refs.modalWindow.show();
    },

    select(target) {
      this.targetDocument = target;
      this.options = null;
    },

    mergeDocuments() {
      if (window.confirm(this.$gettext('Are you sure you want to merge?'))) {
        c2c.moderator.mergeDocuments(this.document.document_id, this.targetDocument.document_id).then(() => {
          // TODO feedback
          this.hide();
        });
      }
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/sass/variables.scss';

.modal-card-body,
.modal-card,
.modal {
  overflow: visible !important;
}

.column {
  padding-top: 0.1rem;
  padding-bottom: 0.1rem;
}

.has-padding-bottom {
  padding-bottom: 1rem;
}
</style>
