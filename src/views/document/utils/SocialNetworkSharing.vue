<template>
  <span
    v-if="enabled"
    v-show="visible"
    class="social-network-sharing"
    addthis:ui_click="true"
    addthis:data_track_clickback="false"
    addthis:data_track_addressbar="false"
    v-bind="$attrs"
    :title="$gettext('Share')"
  >
    <fa-icon icon="share-alt" />
  </span>
</template>

<script>
import config from '@/js/config';

const cdn = '//s7.addthis.com/js/300/addthis_widget.js';

export default {
  data() {
    return { visible: false };
  },

  computed: {
    enabled: function () {
      if (!process.browser) {
        return;
      }
      const enabled = this.$gdpr.get()?.social ?? false;
      enabled ? this.install() : this.uninstall();
      return enabled;
    },
  },

  methods: {
    onAddthisLoad() {
      this.visible = true;
      window.addthis.button('.social-network-sharing');
    },

    install() {
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

    uninstall() {
      this.visible = false;
      const el = document.getElementById('addthis-script');
      if (el === null) {
        return;
      }
      document.body.removeChild(el);
      delete window.addthis;
    },
  },
};
</script>
