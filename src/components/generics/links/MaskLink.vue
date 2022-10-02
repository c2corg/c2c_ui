<template>
  <span>
    <span v-if="$user.isModerator" @click="toggleMask">
      <a v-if="isVersionMasked" v-translate>Unmask version</a>
      <a v-else v-translate>Mask version</a>
    </span>
    <span v-if="isVersionMasked" v-translate>This version is masked.</span>
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

  computed: {
    isVersionMasked() {
      return this.version.masked;
    }
  },

  methods: {
    async toggleMask() {
      try {
        await (
          this.isVersionMasked ?
          c2c.moderator.unmaskVersion(this.id, this.lang, this.version.version_id) :
          c2c.moderator.maskVersion(this.id, this.lang, this.version.version_id)
        );
        this.isVersionMasked = !this.isVersionMasked;
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
