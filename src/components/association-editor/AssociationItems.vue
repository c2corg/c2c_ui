<template>
  <div class="association-items">
    <h2 class="title is-2">
      {{ $filters.uppercaseFirstLetter($gettext(arrayName)) }}
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

<script setup lang="ts">
import { computed, ref, type PropType } from 'vue';

import AssociationImageLink from './AssociationImageLink.vue';
import AssociationOutingLink from './AssociationOutingLink.vue';

import c2c from '@/js/apis/c2c';
import type { DocumentRef } from '@/js/apis/c2c/types';
import { useAssociationRights } from '@/js/composables/association-rights';
import { useGlobalProperties } from '@/js/composables/global-properties';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

type Child = {
  sortKey: string;
  document: C2cDocument;
  status: 'current' | 'deleted' | 'proposition';
  buttonLabel: string;
  disabled: boolean;
};

const props = defineProps({
  parent: {
    type: Object as PropType<C2cDocument>,
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
    type: Array as PropType<C2cDocument[]>,
    required: true,
  },
  propositions: {
    type: Object as PropType<{ total: number; documents: C2cDocument[] }>,
    default: null,
  },
  forbiddenChildren: {
    type: Array as PropType<C2cDocument[]>,
    default: null,
  },
});

const { canAdd, canRemove } = useAssociationRights();
const { $documentUtils, $gettext } = useGlobalProperties();

const promise = ref<{ loading?: boolean }>({});
const deleted = ref<C2cDocument[]>([]);

const children = computed(() => {
  const uniqueDocuments = new Map<number, Child>();

  const append = (array: C2cDocument[] | undefined, status: Child['status'], buttonLabel: string) => {
    for (const document of array ?? []) {
      if (!uniqueDocuments.has(document.document_id!)) {
        uniqueDocuments.set(document.document_id!, {
          sortKey: $documentUtils.getDocumentTitle(document).toLowerCase() + document.document_id,
          document,
          status,
          buttonLabel,
          disabled:
            status === 'current'
              ? !canRemove(props.parent, document)
              : !canAdd(props.parent, document, props.forbiddenChildren),
        });
      }
    }
  };

  append(props.current, 'current', $gettext('Remove'));
  append(deleted.value, 'deleted', $gettext('Put it back'));
  append(props.propositions ? props.propositions.documents : undefined, 'proposition', $gettext('Add'));

  const result = [...uniqueDocuments.values()];
  result.sort((a, b) => (a.sortKey === b.sortKey ? 0 : a.sortKey < b.sortKey ? -1 : 1));

  return result;
});

function add(child: C2cDocument) {
  // for waypoint/waypoint insertion, child/parent order is important :
  // if array name is waypoint_children, then it must be added with
  //
  //     add(parent, child)
  //
  // otherwise, it's inversed : parent document will be the child. So :
  //
  //     add(child, parent)

  let p, c;

  if (props.parent.type === 'w' && props.arrayName === 'waypoints') {
    p = child;
    c = props.parent;
  } else {
    // in all other case, it's the good way
    p = props.parent;
    c = child;
  }

  promise.value = c2c.association.create(p as DocumentRef, c as DocumentRef).then(() => {
    // the association lists of the document are changed in place: the document view shows them
    props.current.push(child);
    deleted.value = deleted.value.filter((doc) => doc.document_id !== child.document_id);
  });
}

function remove(child: C2cDocument) {
  promise.value = c2c.association.remove(props.parent as DocumentRef, child as DocumentRef).then(() => {
    props.current.splice(props.current.indexOf(child), 1);
    deleted.value.push(child);
  });
}

function onclick(child: Child) {
  if (child.status === 'current') {
    remove(child.document);
  } else {
    add(child.document);
  }
}
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
