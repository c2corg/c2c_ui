<template>
  <div class="accessibility-cell">
    <accessibility-badge :result="displayedResult" />
    <verify-accessibility-button
      :document="params.data"
      :transport-context="params.context.transportContext"
      @verified="unitResult = $event"
    />
  </div>
</template>

<script>
export default {
  data() {
    return {
      unitResult: null,
    };
  },

  computed: {
    displayedResult() {
      return this.unitResult ?? this.params.context?.transportContext?.results?.[this.params.data.document_id] ?? null;
    },
  },
};
</script>

<style scoped lang="scss">
.accessibility-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}
</style>
