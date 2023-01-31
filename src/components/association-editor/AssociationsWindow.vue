<template>
  <modal-card ref="modalCard">
    <div slot="title">
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

    <div slot="footer">
      <button class="button is-primary" v-translate @click="$refs.modalCard.hide()">Close</button>
    </div>
  </modal-card>
</template>

<script>
import AssociationItems from './AssociationItems';

import c2c from '@/js/apis/c2c';
import constants from '@/js/constants';
import { requireDocumentProperty } from '@/js/properties-mixins';

export default {
  components: { AssociationItems },
  mixins: [requireDocumentProperty],

  data() {
    return {
      promise: null,
      data: {},
      propositions: {},
      letterTypes: null,
    };
  },

  computed: {
    dataArray() {
      return Object.values(this.data);
    },
  },

  created() {
    // get fields of for parent's document type
    let fields = Object.values(constants.objectDefinitions[this.documentType].fields);

    // keep only fields that belong to association
    fields = fields.filter((field) => field.parent === 'associations');

    // sort this field, given associationEditorOrder property
    fields.sort((a, b) => a.associationEditorOrder - b.associationEditorOrder);

    // get field's document types, and store letters for API search service
    this.letterTypes = fields.map((field) => constants.objectDefinitions[field.documentType].letter);

    // and finally add field in result
    fields.forEach(this.addToData);
  },

  methods: {
    show() {
      this.$refs.modalCard.show();
      this.$nextTick(() => this.$refs.input.focus());
    },

    // used by created() method
    addToData(field) {
      this.data[field.name] = {
        arrayName: field.name,
        documentType: field.documentType,
        current: this.document.associations[field.name],
        searchArrayName: field.documentType + 's',
      };

      // can't have both (X,Y) and (Y,X) associations on waypoints
      if (field.name === 'waypoints') {
        this.data[field.name].forbiddenChildren = this.document.associations.waypoint_children;
      } else if (field.name === 'waypoint_children') {
        this.data[field.name].forbiddenChildren = this.document.associations.waypoints;
      }

      if (field.name === 'users') {
        // api anti pattern ...
        this.data[field.name].searchArrayName = 'users';
      }
    },

    search(event) {
      const text = event.target.value;

      if (text.length >= 3) {
        c2c.search({ q: text, t: this.letterTypes.join(','), limit: 5 }).then(this.computePropositions);
      }
    },

    computePropositions(response) {
      this.propositions = response.data;
    },
  },
};
</script>
