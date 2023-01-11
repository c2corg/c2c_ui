<template>
  <div>
    <div v-if="!promise.data && !promise.error">
      <div class="spinner">
        <div class="spinner-bg" :class="{ flat: !flat }">
          <spinner-icon />
        </div>
      </div>
    </div>

    <not-found v-else-if="notFound" />

    <div v-else-if="promise.error" class="notification is-danger">{{ promise.error.message }}</div>
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
    flat: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    notFound() {
      return Boolean(this.promise?.error?.response?.status === 404);
    },
  },
};
</script>

<style lang="scss" scoped>
.spinner {
  display: flex;
  justify-content: center;
  align-items: center;
}
.spinner-bg {
  display: flex;
  justify-content: center;
  align-items: center;

  &.flat {
    background: white;
    box-shadow: 0 2px 3px rgb(10 10 10 / 10%);
    border-radius: 50%;
    border: 1px solid rgba(10, 10, 10, 0.15);
    height: 2.5em;
    width: 2.5em;
  }
}
</style>
