import CardActivitiesItem from './CardActivitiesItem';
import CardContainer from './CardContainer';
import CardElevationItem from './CardElevationItem';
import CardEventActivityItem from './CardEventActivityItem';
import CardRegionItem from './CardRegionItem';
import CardRow from './CardRow';
import CardTitle from './CardTitle';

import { requireDocumentProperty } from '@/js/properties-mixins';

export const cardMixin = {
  components: {
    CardContainer,
    CardTitle,
    CardRow,
    CardRegionItem,
    CardElevationItem,
    CardActivitiesItem,
    CardEventActivityItem,
  },

  props: {
    target: {
      type: String,
      default: undefined,
    },

    highlighted: {
      type: Boolean,
      default: false,
    },
  },
};

export const documentCardMixin = {
  mixins: [cardMixin, requireDocumentProperty],
};
