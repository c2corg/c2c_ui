<template>
  <div>
    <span>(</span>
    <association-history-link
      :disabled="offsetAsNumber === 0"
      :limit="limit"
      :user-id="userId"
      :document-id="documentId"
    >
      newest
    </association-history-link>
    <span> | </span>
    <association-history-link
      :disabled="!count || offsetAsNumber >= count - limitAsNumber"
      :limit="limit"
      :offset="count - limitAsNumber"
      :user-id="userId"
      :document-id="documentId"
    >
      oldest
    </association-history-link>
    <span>) View : </span>
    <span>(</span>
    <association-history-link
      :disabled="offsetAsNumber === 0"
      :limit="limit"
      :offset="Math.max(offsetAsNumber - limitAsNumber, 0)"
      :user-id="userId"
      :document-id="documentId"
    >
      newer {{ limitAsNumber }}
    </association-history-link>
    <span> | </span>
    <association-history-link
      :disabled="!count || offsetAsNumber + limitAsNumber >= count"
      :limit="limit"
      :offset="offsetAsNumber + limitAsNumber"
      :user-id="userId"
      :document-id="documentId"
    >
      older {{ limitAsNumber }}
    </association-history-link>
    <span>)</span>
  </div>
</template>

<script>
export default {
  props: {
    count: {
      type: Number,
      required: true,
    },
    documentId: {
      type: Number,
      default: null,
    },
    userId: {
      type: Number,
      default: null,
    },
    limit: {
      type: Number,
      default: null,
    },
    offset: {
      type: Number,
      default: null,
    },
  },

  computed: {
    limitAsNumber() {
      return this.limit || 50;
    },
    offsetAsNumber() {
      return this.offset || 0;
    },
  },
};
</script>
