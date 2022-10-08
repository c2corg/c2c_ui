<template>
  <span>
    <span v-if="$user.isModerator" @click="toggleMask">
      <a v-if="version.masked" v-translate>Unmask</a>
      <a v-else v-translate>Mask</a>
    </span>
    <span v-if="version.masked">
      [<span v-translate>This version is masked.</span>]
    </span>
  </span>
</template>

<script>
import { toast } from 'bulma-toast';

import c2c from '@/js/apis/c2c';

export default {

  props: {
    version: {
      type: Object,
      required: true,
    },
    lang: {
      type: String,
      required: true,
    },
    id: {
      type: Number,
      required: true,
    },
  },

  methods: {
    async toggleMask() {
      try {
        await (
          this.version.masked ?
          c2c.moderator.unmaskVersion(this.id, this.lang, this.version.version_id) :
          c2c.moderator.maskVersion(this.id, this.lang, this.version.version_id)
        );
        this.version.masked = !this.version.masked;
      } catch (error) {
        toast({
          message: this.$gettext(`An error occurred, couldn't (un)mask version`),
          type: 'is-danger',
        });
      }
    },
  },
};
</script>
