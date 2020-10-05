<template>
  <div>
    <div v-if="!promise.data && !promise.error" class="notification is-primary">Loading</div>

    <not-found v-else-if="notFound" />

    <div v-else-if="promise.error" class="notification is-danger">
      {{ promise.error.message }}
    </div>
  </div>
</template>

<script>
import NotFound from '@/views/static-views/NotFoundView';

export default {
  components: {
    NotFound,
  },

  props: {
    promise: {
      type: [Object, Promise],
      required: true,
    },
  },

  computed: {
    notFound() {
      return Boolean(this.promise.error && this.promise.error.response && this.promise.error.response.status === 404);
    },
  },
};
</script>
