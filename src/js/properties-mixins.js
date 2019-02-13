
export const requireDocumentProperty = {
  props: {
    document: {
      type: Object,
      required: true
    }
  },

  computed: {
    documentType() {
      return this.$documentUtils.getDocumentType(this.document.type);
    }
  }
};

export const requireFieldProperty = {
  props: {
    field: {
      type: Object,
      required: true
    }
  }
};

export const requireDocumentTypeProperty = {
  props: {
    documentType: {
      type: String,
      required: true,
      validator: value => {
        return value.length > 1;
      }
    }
  }
};
