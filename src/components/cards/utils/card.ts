// What the cards share: their parts, and their props. The document cards add documentProperty and useDocumentType()
// (@/js/properties).
import CardActivitiesItem from './CardActivitiesItem.vue';
import CardContainer from './CardContainer.vue';
import CardElevationItem from './CardElevationItem.vue';
import CardEventActivityItem from './CardEventActivityItem.vue';
import CardRegionItem from './CardRegionItem.vue';
import CardRow from './CardRow.vue';
import CardTitle from './CardTitle.vue';

export const cardComponents = {
  CardContainer,
  CardTitle,
  CardRow,
  CardRegionItem,
  CardElevationItem,
  CardActivitiesItem,
  CardEventActivityItem,
};

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
