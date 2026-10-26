// The props many components share: the document, field, or document type they show. Spread them in the props:
//
//   props: { ...documentProperty, ...fieldProperty },
//   setup(props) {
//     return useDocumentType(props);
//   },
import { computed, getCurrentInstance, type PropType } from 'vue';

import type Field from '@/js/constants/Field';
import type { C2cDocument } from '@/js/vue-plugins/document-utils';

export const documentProperty = {
  document: {
    type: Object as PropType<C2cDocument>,
    required: true as const,
  },
};

export const fieldProperty = {
  field: {
    type: Object as PropType<Field>,
    required: true as const,
  },
};

export const documentTypeProperty = {
  documentType: {
    type: String,
    required: true as const,
    validator: (value: string) => {
      return value.length > 1;
    },
  },
};

/** The type of the document (route, waypoint...), from its letter */
export function useDocumentType(props: { document: { type?: string } }) {
  const globals = getCurrentInstance()!.appContext.config.globalProperties;

  return {
    documentType: computed(() => globals.$documentUtils.getDocumentType(props.document.type)),
  };
}
