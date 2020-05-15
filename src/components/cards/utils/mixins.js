import { requireDocumentProperty } from '@/js/properties-mixins';

import CardContainer from './CardContainer';
import CardTitle from './CardTitle';
import CardRow from './CardRow';
import CardRegionItem from './CardRegionItem';
import CardElevationItem from './CardElevationItem';
import CardActivitiesItem from './CardActivitiesItem';
import CardEventActivityItem from './CardEventActivityItem';

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
