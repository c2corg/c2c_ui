import type { PropType } from 'vue';

import type { TransportContext } from '@/js/transport-query';

// What the cards share: their props. The document cards add documentProperty and useDocumentType()
// (@/js/properties).
export const cardProps = {
  target: {
    type: String,
    default: undefined,
  },

  highlighted: {
    type: Boolean,
    default: false,
  },
};

// the public transport search of the list (route and waypoint cards): the round-trip check of the document
export const transportContextProperty = {
  transportContext: {
    type: Object as PropType<TransportContext | null>,
    default: null,
  },
};
