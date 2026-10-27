<template>
  <modal-card ref="modal">
    <template #title>
      <div>
        <div class="control">
          <div class="field">
            <input
              class="input"
              ref="input"
              :placeholder="$gettext('Search a document to associate...')"
              @input="search"
            />
          </div>
        </div>
      </div>
    </template>

    <association-items
      v-for="item of data"
      :key="item.arrayName"
      :parent="document"
      :array-name="item.arrayName"
      :child-type="item.documentType"
      :current="item.current"
      :forbidden-children="item.forbiddenChildren"
      :propositions="propositions[item.searchArrayName]"
    />

    <template #footer>
      <div>
        <button class="button is-primary" v-translate @click="hide">Close</button>
      </div>
    </template>
  </modal-card>
</template>

<script setup lang="ts">
import { nextTick, reactive, ref, useTemplateRef } from 'vue';

import AssociationItems from './AssociationItems.vue';

import c2c from '@/js/apis/c2c';
import { useGlobalProperties } from '@/js/composables/global-properties';
import constants from '@/js/constants';
import type Field from '@/js/constants/Field';
import { documentProperty, useDocumentType } from '@/js/properties';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

type AssociationItem = {
  arrayName: string;
  documentType: string;
  current: C2cDocument[];
  searchArrayName: string;
  forbiddenChildren?: C2cDocument[];
};

const props = defineProps({ ...documentProperty });

const { documentType } = useDocumentType(props);
const { $language } = useGlobalProperties();

const data = reactive<Record<string, AssociationItem>>({});
const propositions = ref<Record<string, { total: number; documents: C2cDocument[] }>>({});
const modal = useTemplateRef<{ show(): void; hide(): void }>('modal');
const input = useTemplateRef<HTMLInputElement>('input');

type ObjectDefinitions = Record<string, { letter: string; fields: Record<string, Field> }>;
const definitions = constants.objectDefinitions as unknown as ObjectDefinitions;

function addToData(field: Field) {
  const associations = props.document.associations!;
  const item: AssociationItem = {
    arrayName: field.name,
    documentType: field.documentType!,
    current: associations[field.name],
    searchArrayName: field.documentType + 's',
  };

  // can't have both (X,Y) and (Y,X) associations on waypoints
  if (field.name === 'waypoints') {
    item.forbiddenChildren = associations.waypoint_children;
  } else if (field.name === 'waypoint_children') {
    item.forbiddenChildren = associations.waypoints;
  }

  if (field.name === 'users') {
    // api anti pattern ...
    item.searchArrayName = 'users';
  }

  data[field.name] = item;
}

// get fields of for parent's document type, keep only fields that belong to association,
// and sort them, given associationEditorOrder property
const fields = Object.values(definitions[documentType.value].fields)
  .filter((field) => field.parent === 'associations')
  .sort((a, b) => a.associationEditorOrder! - b.associationEditorOrder!);

// get field's document types, and store letters for API search service
const letterTypes = fields.map((field) => definitions[field.documentType!].letter);

// and finally add field in result
fields.forEach(addToData);

function show() {
  modal.value!.show();
  nextTick(() => input.value!.focus());
}

function hide() {
  modal.value!.hide();
}

function search(event: Event) {
  const text = (event.target as HTMLInputElement).value;

  if (text.length >= 3) {
    c2c
      .search({
        q: text,
        t: letterTypes.join(','),
        limit: 5,
        l: $language.current,
        pl: $language.current,
      })
      .then((response) => {
        propositions.value = response.data;
      });
  }
}

// the tool box opens it
defineExpose({ show });
</script>
