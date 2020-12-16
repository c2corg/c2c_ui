<template>
  <a class="todo-button" v-if="canTag" @click="onClick" :title="tooltip" :class="{ active: todo }">
    <fa-icon icon="star" />
  </a>
</template>

<script>
import { toast } from 'bulma-toast';

import c2c from '@/js/apis/c2c';
import { requireDocumentProperty } from '@/js/properties-mixins';

export default {
  mixins: [requireDocumentProperty],

  data() {
    return {
      todo: false,
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

  async created() {
    if (this.canTag) {
      // on error, let todo be falsy
      this.todo = (await c2c.tags.get(this.document)).data.todo;
    }
  },

  methods: {
    async onClick() {
      try {
        await (this.todo ? c2c.tags.remove(this.document) : c2c.tags.add(this.document));
        this.todo = !this.todo;
      } catch (error) {
        toast({
          message: this.$gettext(`An error occurred, couldn't (un)mark route as to do`),
          type: 'is-danger',
        });
      }
    },
  },
};
</script>

<style scoped lang="scss">
@import '@/assets/sass/variables.scss';

.todo-button.active {
  color: $yellow !important;
}
</style>
