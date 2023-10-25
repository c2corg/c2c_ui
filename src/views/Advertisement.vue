<template>
  <div class="advertisement">
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
    <img src="@/assets/img/pub_768x90.png" loading="lazy" />
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
.advertisement {
  width: 768px;
  height: 90px;
  position: relative;
  margin-left: auto;
  margin-right: auto;

  iframe {
    height: 768px;
    width: 90px;
  }

  .advertisement-fallback {
    display: block;
    position: aboslute;
    top: 0;
    left: 0;

    img {
      width: 768px !important;
      height: 90px !important;
    }
  }
}
</style>
