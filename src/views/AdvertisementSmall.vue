<template>
  <div class="advertisement-small no-print">
    <!--<iframe
      :title="$gettext('advertisement')"
      :src="$options.publicPath + 'revive-adserver.html'"
      frameborder="0"
      scrolling="no"
    />

    <router-link v-if="enableFallback" :to="{ name: 'serac' }" class="advertisement-fallback">
      <picture>
        <source srcset="@/assets/img/serac.webp" type="image/webp" />
        <source srcset="@/assets/img/serac.avif" type="image/avif" />
        <img src="@/assets/img/serac.png" loading="lazy" />
      </picture>
    </router-link>-->
    <img src="@/assets/img/pub_300x250.png" loading="lazy" />
  </div>
</template>

<script>
import config from '@/js/config';

// https://github.com/c2corg/v6_ui/blob/c9962a6c3bac0670eab732d563f9f480379f84d1/c2corg_ui/static/affiz.html

export default {
  data() {
    return {
      enableFallback: false,
    };
  },

  publicPath: config.publicPath,
};
</script>

<style scoped lang="scss">
.advertisement-small {
  width: 300px !important;
  height: 250px !important;
  position: relative;
  margin-left: auto;
  margin-right: auto;
  margin-bottom: $size-7;

  iframe {
    height: 300px;
    width: 250px;
  }

  img {
    width: 300px !important;
    height: 250px !important;
  }

  .advertisement-fallback {
    display: block;
    position: aboslute;
    top: 0;
    left: 0;

    img {
      width: 300px !important;
      height: 250px !important;
    }
  }
}
</style>
