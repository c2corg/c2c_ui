<template>
  <div class="no-result-view">
    <fa-icon :icon="['far', 'face-frown']" size="2xl" aria-hidden="true" />
    <span class="no-result-view-title" v-translate>No result found</span>
    <span class="no-result-view-description" v-translate>We can't find any results matching your search.</span>
    <span class="no-result-found" v-if="errorMessages[error?.id] ?? error?.message">
      {{ errorMessages[error?.id] ?? error?.message }}
    </span>
  </div>
</template>

<script>
export default {
  name: 'ItinevertNoResultView',
  props: {
    error: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      errorMessages: {
        date_out_of_bounds: this.$gettext('Public transport schedules are not yet known for this period.'),
      },
    };
  },
};
</script>

<style scoped lang="scss">
.no-result-found {
  color: red;
  font-size: 12px;
  font-style: italic;
}

.no-result-view {
  margin: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding-top: calc($itinevert-header-height);
}

.no-result-view-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 6px;
}

.no-result-view-description {
  color: #7b7b7b;
  font-size: 14px;
}
</style>
