<template>
  <div class="no-result-view">
    <fa-icon :icon="['far', 'face-frown']" size="2xl" aria-hidden="true" />
    <span class="no-result-view-title" v-translate>No result found</span>
    <span class="no-result-view-description" v-translate>We can't find any results matching your search.</span>
  </div>
</template>

<script>
export default {
  name: 'ItinevertNoResultView',
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
}

.no-result-view-title {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 6px;
}

.no-result-view-description {
  color: #7b7b7b;
  font-size: 14px;
  margin-bottom: 20px;
}
</style>
