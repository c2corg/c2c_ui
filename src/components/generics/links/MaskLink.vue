<template>
  <span>
    <button @click="toggleMask" class="button is-small is-ghost">
      <!-- $gettext('Masked') -->
      <!-- $gettext('Visible') -->
      <fa-icon :icon="masked ? 'eye-slash' : 'eye'" :title="$gettext(masked ? 'Masked' : 'Visible')" />
    </button>
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
    masked() {
      return this.version.masked;
    },
  },

  methods: {
    async toggleMask() {
      try {
        await (this.version.masked
          ? c2c.moderator.unmaskVersion(this.id, this.lang, this.version.version_id)
          : c2c.moderator.maskVersion(this.id, this.lang, this.version.version_id));
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
