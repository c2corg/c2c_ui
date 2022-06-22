<template>
  <div class="advertisement">
    <iframe
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
    </router-link>
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

  isProduction: config.isProduction,
  publicPath: config.publicPath,
};
</script>

<style scoped lang="scss">
.advertisement {
  width: 160px;
  height: 320px;
  position: relative;
  margin-left: auto;
  margin-right: auto;

  iframe {
    height: 320px;
    width: 160px;
  }

  .advertisement-fallback {
    display: block;
    position: aboslute;
    top: 0;
    left: 0;

    img {
      width: 160px;
      height: 320px;
    }
  }
}
</style>
