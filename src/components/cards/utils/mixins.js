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

    /**
     * Active transport search context (`{ fromAddress, date, minDeparture, maxReturn, hikingDuration, results }`). Only
     * used by RouteCard/WaypointCard to display accessibility badges and the unit verification button; has no effect on
     * other card types.
     */
    transportContext: {
      type: Object,
      default: null,
    },
  },
};

export const documentCardMixin = {
  mixins: [cardMixin, requireDocumentProperty],
};
