<template>
  <span>
    <span
      v-if="addThisEnabled"
      v-show="addThisVisible"
      class="social-network-sharing"
      addthis:ui_click="true"
      addthis:data_track_clickback="false"
      addthis:data_track_addressbar="false"
      v-bind="$attrs"
      :title="$gettext('Share')"
    >
      <fa-icon icon="share-alt" />
    </span>
    <span v-else-if="supportsWebShare" :title="$gettext('Share')" @click="webShare()">
      <fa-icon icon="share-alt" />
    </span>
  </span>
</template>

<script>
import { browser } from 'process';

import config from '@/js/config';

const cdn = '//s7.addthis.com/js/300/addthis_widget.js';

export default {
  data() {
    return { addThisVisible: false };
  },

  computed: {
    addThisEnabled: function () {
      if (!browser) {
        return;
      }
      const enabled = this.$gdpr.get()?.social ?? false;
      enabled ? this.installAddThis() : this.uninstallAddThis();
      return enabled;
    },

    supportsWebShare() {
      return !!navigator.share;
    },
  },

  methods: {
    onAddthisLoad() {
      this.addThisVisible = true;
      window.addthis.button('.social-network-sharing');
    },

    installAddThis() {
      if (document.getElementById('addthis-script') !== null) {
        this.onAddthisLoad();
        return;
      }

      const el = document.createElement('script');

      el.setAttribute('id', 'addthis-script');
      el.setAttribute('src', `${cdn}#pubid=${config.addthisPublicId}`);
      el.onload = this.onAddthisLoad;
      document.body.appendChild(el);
    },

    uninstallAddThis() {
      this.addThisVisible = false;
      const el = document.getElementById('addthis-script');
      if (el === null) {
        return;
      }
      document.body.removeChild(el);
      delete window.addthis;
    },

    webShare() {
      navigator.share({
        title: this.$documentUtils.getDocumentTitle(this.$parent.document),
        url: window.location.href,
      });
    },
  },
};
</script>
