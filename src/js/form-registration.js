/*
 * Form containers (BaseForm, FormSection) learn which fields they contain through provide / inject: the fields register
 * themselves. It replaces walking $children, which Vue 3 removes.
 *
 *   container: mixins: [formContainer('baseForm')]  ->  this.formFields, the registered fields (reactive)
 *   field:     mixins: [formField('baseForm')]      ->  registered with the nearest container, if any
 */

export function formContainer(key) {
  return {
    provide() {
      return {
        [key]: {
          register: (field) => this.formFields.push(field),
          unregister: (field) => {
            const index = this.formFields.indexOf(field);
            if (index !== -1) {
              this.formFields.splice(index, 1);
            }
          },
        },
      };
    },

    data() {
      return { formFields: [] };
    },
  };
}

export function formField(key) {
  return {
    inject: { [key]: { default: null } },

    created() {
      this[key]?.register(this);
    },

    beforeDestroy() {
      this[key]?.unregister(this);
    },
  };
}
