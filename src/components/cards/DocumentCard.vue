<template>
  <div class="document-card-container">
    <component
      :is="documentType + '-card'"
      :document="document"
      class="document-card"
      :target="target"
      :highlighted="highlighted"
    />
    <delete-button v-if="showDeleteButton" @click="$emit('delete')" class="delete-button" />
  </div>
</template>

<script>
import AreaCard from './AreaCard';
import ArticleCard from './ArticleCard';
import BookCard from './BookCard';
import MapCard from './MapCard';
import OutingCard from './OutingCard';
import ProfileCard from './ProfileCard';
import RouteCard from './RouteCard';
import WaypointCard from './WaypointCard';
import XreportCard from './XreportCard';

import { requireDocumentProperty } from '@/js/properties-mixins';

export default {
  components: {
    AreaCard,
    ArticleCard,
    BookCard,
    MapCard,
    OutingCard,
    ProfileCard,
    RouteCard,
    WaypointCard,
    XreportCard,
  },

  mixins: [requireDocumentProperty],

  props: {
    showDeleteButton: {
      type: Boolean,
      default: false,
    },

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
</script>

<style scoped lang="scss">
@import '@/assets/sass/variables.scss';

.document-card-container {
  position: relative;

  .document-card {
    border-left: 2px solid $color-base-c2c;
  }
}

@media screen and (max-width: $tablet) {
  .document-card {
    border-left: 0 !important;
    border-right: 0 !important;
  }
}

.delete-button {
  position: absolute;
  top: -0.5rem;
  right: -0.5rem;
  font-size: 2rem;
}
</style>
