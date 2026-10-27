<template>
  <div class="document-card-container">
    <component
      :is="CARDS[documentType]"
      :document="document"
      class="document-card"
      :target="target"
      :highlighted="highlighted"
    />
    <delete-button v-if="showDeleteButton" @click="$emit('delete')" class="delete-button" />
  </div>
</template>

<script setup lang="ts">
import type { Component } from 'vue';

import AreaCard from './AreaCard.vue';
import ArticleCard from './ArticleCard.vue';
import BookCard from './BookCard.vue';
import MapCard from './MapCard.vue';
import OutingCard from './OutingCard.vue';
import ProfileCard from './ProfileCard.vue';
import RouteCard from './RouteCard.vue';
import WaypointCard from './WaypointCard.vue';
import XreportCard from './XreportCard.vue';

import { documentProperty, useDocumentType } from '@/js/properties';

const props = defineProps({
  ...documentProperty,
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
});
defineEmits(['delete']);

const { documentType } = useDocumentType(props);

const CARDS: Record<string, Component> = {
  area: AreaCard,
  article: ArticleCard,
  book: BookCard,
  map: MapCard,
  outing: OutingCard,
  profile: ProfileCard,
  route: RouteCard,
  waypoint: WaypointCard,
  xreport: XreportCard,
};
</script>

<style scoped lang="scss">
.document-card-container {
  position: relative;

  .document-card {
    border-radius: $radius;
    border-left: 2px solid $color-base-c2c;
  }
}

.delete-button {
  position: absolute;
  top: -0.5rem;
  right: -0.5rem;
  font-size: 2rem;
}

@media screen and (max-width: $tablet) {
  .document-card-container .document-card {
    border-left: $card-border;
  }

  .delete-button {
    right: 0;
  }
}
</style>
