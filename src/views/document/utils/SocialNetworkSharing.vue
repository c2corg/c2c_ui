<template>
  <span
    v-show="visible"
    class="social-network-sharing"
    addthis:ui_click="true"
    v-bind="$attrs"
    :title="$gettext('Share')">
    <fa-icon icon="share-square" />
  </span>
</template>

<script>
  import config from '@/js/config';

  const cdn = '//s7.addthis.com/js/300/addthis_widget.js';

  export default {
    data() {
      return {
        visible: false
      };
    },

    mounted() {
      if (process.browser) {
        if (document.getElementById('addthis-script') !== null) {
          this.onAddthisLoad();
          return;
        }

        const el = document.createElement('script');

        el.setAttribute('id', 'addthis-script');
        el.setAttribute('src', `${cdn}#pubid=${config.addthisPublicId}`);
        el.onload = this.onAddthisLoad;
        document.body.appendChild(el);
      }
    },

    methods: {
      onAddthisLoad() {
        this.visible = true;
        window.addthis.button('.social-network-sharing');
      }
    }
  };
</script>
