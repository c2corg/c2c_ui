<template>
  <span>
    <icon-book class="has-text-normal" />
    <document-title :document="book" />,
    <em class="has-text-normal">{{ book.author }}</em>
  </span>
</template>

<script>
export default {
  props: {
    book: {
      type: Object,
      required: true,
    },
  },
};
</script>
