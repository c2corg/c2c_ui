<template>
  <a v-if="canTag" @click="onClick" :title="tooltip" :class="{ 'todo-button-yellow': todo }">
    <fa-icon icon="star" />
  </a>
</template>

<script>
import c2c from '@/js/apis/c2c';
import { requireDocumentProperty } from '@/js/properties-mixins';

export default {
  mixins: [requireDocumentProperty],

  data() {
    return {
      todo: null,
    };
  },

  computed: {
    canTag() {
      return this.document.type === 'r' && this.$user.isLogged;
    },

    tooltip() {
      if (this.todo) {
        return this.$gettext('Unmark this route as to do');
      } else {
        return this.$gettext('Mark this route as to do');
      }
    },
  },

  created() {
    if (this.canTag) {
      c2c.tags.get(this.document).then((response) => {
        this.todo = response.data.todo;
      });
    }
  },

  methods: {
    onClick() {
      if (this.todo) {
        c2c.tags.remove(this.document).then(() => {
          this.todo = false;
        });
      } else {
        c2c.tags.add(this.document).then(() => {
          this.todo = true;
        });
      }
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/sass/variables.scss';

.todo-button-yellow {
  color: $yellow !important;
}
</style>
