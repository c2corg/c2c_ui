<template>
  <div class="association-items">
    <h2 class="title is-2">
      {{ $gettext(arrayName) | uppercaseFirstLetter }}
    </h2>

    <div
      v-for="child of children"
      :key="child.document.document_id"
      class="columns is-mobile is-gapless document-row has-hover-background"
    >
      <div class="column">
        <document-link v-if="childType === 'profile'" :document="child.document" target="_blank">
          @{{ child.document.forum_username }} (<document-title :document="child.document" />)
        </document-link>

        <pretty-waypoint-link v-else-if="childType === 'waypoint'" :waypoint="child.document" target="_blank" />

        <pretty-book-link v-else-if="childType === 'book'" :book="child.document" target="_blank" />

        <association-outing-link v-else-if="childType === 'outing'" :outing="child.document" />

        <association-image-link v-else-if="childType === 'image'" :image="child.document" />

        <pretty-route-link
          v-else-if="childType === 'route'"
          :route="child.document"
          hide-orientation
          hide-height-diff-difficulties
          target="_blank"
        />

        <document-link v-else :document="child.document" target="_blank" />
      </div>
      <div class="column is-narrow">
        <button
          class="button is-small is-pulled-right"
          :class="{
            'is-loading': promise.loading,
            'is-danger': child.status === 'current',
            'is-info': child.status === 'deleted',
            'is-success': child.status === 'proposition',
          }"
          :disabled="child.disabled"
          @click="onclick(child)"
        >
          {{ child.buttonLabel }}
        </button>
      </div>
    </div>

    <div
      v-if="propositions && propositions.total !== propositions.documents.length"
      class="has-text-grey-light has-text-centered"
      v-translate
    >
      Too many results: please refine your search.
    </div>
  </div>
</template>

<script>
import AssociationImageLink from './AssociationImageLink';
import AssociationOutingLink from './AssociationOutingLink';

import c2c from '@/js/apis/c2c';
import associationRights from '@/js/associations-rights-mixin';

export default {
  components: {
    AssociationOutingLink,
    AssociationImageLink,
  },

  mixins: [associationRights],

  props: {
    parent: {
      type: Object,
      required: true,
    },
    arrayName: {
      type: String,
      required: true,
    },
    childType: {
      type: String,
      required: true,
    },
    current: {
      type: Array,
      required: true,
    },
    propositions: {
      type: Object,
      default: null,
    },
    forbiddenChildren: {
      type: Array,
      default: null,
    },
  },

  data() {
    return {
      promise: {},
      deleted: [],
    };
  },

  computed: {
    children() {
      const uniqueDocuments = new Map();

      const append = function (array, status, buttonLabel) {
        for (const document of array ?? []) {
          if (!uniqueDocuments.has(document.document_id)) {
            uniqueDocuments.set(document.document_id, {
              sortKey: this.$documentUtils.getDocumentTitle(document).toLowerCase() + document.document_id,
              document,
              status,
              buttonLabel,
              disabled:
                status === 'current'
                  ? !this.canRemove(this.parent, document)
                  : !this.canAdd(this.parent, document, this.forbiddenChildren),
            });
          }
        }
      }.bind(this);

      append(this.current, 'current', this.$gettext('Remove'));
      append(this.deleted, 'deleted', this.$gettext('Put it back'));
      append(this.propositions ? this.propositions.documents : undefined, 'proposition', this.$gettext('Add'));

      const result = [...uniqueDocuments.values()];
      result.sort((a, b) => (a.sortKey === b.sortKey ? 0 : a.sortKey < b.sortKey ? -1 : 1));

      return result;
    },
  },

  methods: {
    onclick(child) {
      if (child.status === 'current') {
        this.remove(child.document);
      } else {
        this.add(child.document);
      }
    },

    add(child) {
      // for waypoint/waypoint insertion, child/parent order is important :
      // if array name is waypoint_children, then it must be added with
      //
      //     add(parent, child)
      //
      // otherwise, it's inversed : parent document will be the child. So :
      //
      //     add(child, parent)

      let p, c;

      if (this.parent.type === 'w' && this.arrayName === 'waypoints') {
        p = child;
        c = this.parent;
      } else {
        // in all other case, it's the good way
        p = this.parent;
        c = child;
      }

      this.promise = c2c.association.create(p, c).then(() => {
        this.current.push(child);
        this.deleted = this.deleted.filter((doc) => doc.document_id !== child.document_id);
      });
    },

    remove(child) {
      this.promise = c2c.association.remove(this.parent, child).then(() => {
        this.current.splice(this.current.indexOf(child), 1);
        this.deleted.push(child);
      });
    },
  },
};
</script>

<style scoped lang="scss">
.association-items {
  margin-bottom: 1rem;

  h2 {
    margin-bottom: 0.1rem !important;
  }
}

.document-row {
  padding: 2px;
  margin-bottom: 0 !important;
}
</style>
