<template>
  <div class="association-items">
    <h2 class="title is-2">
      {{ $gettext(arrayName) | uppercaseFirstLetter }}
    </h2>

    <div
      v-for="child of childs"
      :key="child.document.document_id"
      class="columns is-mobile is-gapless document-row has-hover-background">
      <div class="column">

        <document-link v-if="childType==='profile'" :document="child.document">
          @{{ child.document.forum_username }}
          (<document-title :document="child.document" />)
        </document-link>

        <pretty-waypoint-link v-else-if="childType==='waypoint'" :waypoint="child.document" />

        <pretty-book-link v-else-if="childType==='book'" :book="child.document" />

        <association-outing-link v-else-if="childType==='outing'" :outing="child.document" />

        <association-image-link v-else-if="childType==='image'" :image="child.document" />

        <pretty-route-link
          v-else-if="childType==='route'"
          :route="child.document"
          hide-orientation
          hide-height-diff-difficulties />

        <document-link v-else :document="child.document" />
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
          @click="onclick(child)">
          {{ child.buttonLabel }}
        </button>
      </div>
    </div>

    <div
      v-if="propositions && propositions.total !== propositions.documents.length"
      class="has-text-grey-light has-text-centered"
      v-translate>
      Too many results: please refine your search.
    </div>

  </div>
</template>

<script>
  import c2c from '@/js/apis/c2c';
  import AssociationOutingLink from './AssociationOutingLink';
  import AssociationImageLink from './AssociationImageLink';

  export default {
    components: {
      AssociationOutingLink,
      AssociationImageLink
      },

    props: {

      parent: {
        type: Object,
        required: true
      },
      arrayName: {
        type: String,
        required: true
      },
      childType: {
        type: String,
        required: true
      },
      current: {
        type: Array,
        required: true
      },
      propositions: {
        type: Object,
        default: null
      },
      forbiddenChildren: {
        type: Array,
        default: null
      }
    },

    data() {
      return {
        promise: {},
        deleted: []
      };
    },

    computed: {

      childs() {
        const uniqueDocuments = new Map();

        const append = function(array, status, buttonLabel) {
          for (const document of array || []) {
            if (!uniqueDocuments.has(document.document_id)) {
              uniqueDocuments.set(document.document_id, {
                sortKey: this.$documentUtils.getDocumentTitle(document).toLowerCase() + document.document_id,
                document,
                status,
                buttonLabel,
                disabled: status === 'current' ? !this.canRemove(document) : !this.canAdd(document)
              });
            }
          }
        }.bind(this);

        append(this.current, 'current', this.$gettext('Remove'));
        append(this.deleted, 'deleted', this.$gettext('Put it back'));
        append(this.propositions ? this.propositions.documents : undefined, 'proposition', this.$gettext('Add'));

        const result = [...uniqueDocuments.values()];
        result.sort((a, b) => a.sortKey < b.sortKey ? -1 : 1);

        return result;
      }
    },

    methods: {
      canAdd(child) {
        // technical limitation : for waypoint/waypoint associations
        if (this.forbiddenChildren && this.forbiddenChildren.find(e => e.document_id === child.document_id) !== undefined) {
          return false;
        }

        // can't associate a document to itself
        if (this.parent.document_id === child.document_id) {
          return false;
        }

        // moderator can always add
        if (this.$user.isModerator) {
          return true;
        }

        /**********************************
        /* rules for standard users. Do not forget that if he can open this window, he can edit parent
        **********************************/

        // only moderator can add waypoint/waypoint association
        if (this.parent.type === 'w' && this.childType === 'waypoint') {
          return false;
        }

        if (this.childType === 'article' && child.article_type === 'personal') {
          return false; // TODO API : if user is article owner, he can => add author in response
        }

        if (this.childType === 'xreport') {
          return false; // TODO API : if user is xreport owner, he can => add author in response
        }

        if (this.childType === 'image') {
          return true; // TODO API : add image_type (collab), and author
        }

        return true;
      },

      canRemove(child) {
        // technical limitation : an outing must have at least one route
        if (this.parent.type === 'o' && this.childType === 'route' && this.current.length === 1) {
          return false;
        }

        // otherwise, moderator can always remove
        if (this.$user.isModerator) {
          return true;
        }

        /**********************************
                / rules for standard user. Do not forget that if he can open this window, he can edit parent
                **********************************/

        // if it's an outing, user can do whatever he want's, except remove itself
        if (this.parent.type === 'o') {
          return child.document_id !== this.$user.id;
        }

        // if parent document is user own profile : can always remove
        if (this.parent.document_id === this.$user.id) {
          return true;
        }

        if (this.childType === 'article' && child.article_type === 'personal') {
          return false; // TODO API : if user is article owner, he can => add author in response
        }

        if (this.childType === 'xreport') {
          return false; // TODO API : if user is xreport owner, he can => add author in response
        }

        if (this.childType === 'image') {
          return false; // TODO API : add image_type (collab), and author
        }

        if (this.childType === 'outing') {
          return child.author.user_id === this.$user.id;
        }

        return false;
      },

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
        } else { // in all other case, it's the good way
          p = this.parent;
          c = child;
        }

        this.promise = c2c.association.create(p, c)
          .then((response) => {
            this.current.push(child);
            this.deleted = this.deleted.filter(doc => doc.document_id !== child.document_id);
        });
      },

      remove(child) {
        this.promise = c2c.association.remove(this.parent, child)
          .then((response) => {
            this.current.splice(this.current.indexOf(child), 1);
            this.deleted.push(child);
        });
      }
    }
  };
</script>

<style scoped lang="scss">

  @import '@/assets/sass/variables.scss';

  .association-items{
    margin-bottom: 1rem;

    h2{
      margin-bottom: 0.1rem!important;
    }
  }

  .document-row{
    padding:2px;
    margin-bottom: 0!important;
  }
</style>
