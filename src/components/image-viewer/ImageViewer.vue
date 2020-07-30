<template>
  <div v-if="visible" class="image-viewer">
    <div class="is-flex has-text-grey-lighter image-viewer-header">
      <span class="is-size-4 is-ellipsed-tablet image-viewer-title">
        {{ activeDocument.locales[0].title || '&nbsp;' }}
      </span>
      <span class="is-size-5 is-nowrap image-viewer-buttons">
        <document-link :document="activeDocument" class="has-text-grey-lighter">
          <fa-icon icon="eye" />
        </document-link>

        <edit-link
          :document="activeDocument"
          :lang="activeDocument.available_langs[0]"
          class="has-text-grey-lighter"
          @click="close()"
        >
          <fa-icon icon="edit" />
        </edit-link>

        <fa-icon class="has-cursor-pointer" icon="info-circle" @click="toggleImageInfo(activeDocument)" />
        <fa-icon class="has-cursor-pointer" :icon="isFullscreen ? 'compress' : 'expand'" @click="toggleFullscreen" />
        <fa-icon class="has-cursor-pointer" icon="plus" transform="rotate-45" @click="close()" />
      </span>
    </div>

    <div ref="swiper" class="image-viewer-swiper">
      <div class="swiper-wrapper" />
      <div class="swiper-button-prev" />
      <div class="swiper-button-next" />
    </div>

    <div class="image-viewer-pagination is-hidden-mobile">
      <span
        v-for="(image, index) of images"
        :key="image.document_id"
        class="image-viewer-bullet has-cursor-pointer"
        :class="{ 'image-viewer-bullet-active': image === activeDocument }"
        :title="image.locales[0].title"
        @click="onPaginationClick(index)"
        :style="`width: calc((100vw - 1.5rem) / ${images.length});`"
      />
    </div>

    <image-info ref="imageInfo" class="image-viewer-info" />
  </div>
</template>

<script>
import Swiper from 'swiper/dist/js/swiper.js';

import ImageInfo from './ImageInfo';

import imageUrls from '@/js/image-urls';

const requestFullscreen = function (wrapper) {
  if (wrapper.requestFullscreen) {
    wrapper.requestFullscreen();
  } else if (wrapper.mozRequestFullScreen) {
    /* Firefox */
    wrapper.mozRequestFullScreen();
  } else if (wrapper.webkitRequestFullscreen) {
    /* Chrome, Safari and Opera */
    wrapper.webkitRequestFullscreen();
  } else if (wrapper.msRequestFullscreen) {
    /* IE/Edge */
    wrapper.msRequestFullscreen();
  }
};

const exitFullscreen = function () {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.mozCancelFullScreen) {
    /* Firefox */
    document.mozCancelFullScreen();
  } else if (document.webkitExitFullscreen) {
    /* Chrome, Safari and Opera */
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) {
    /* IE/Edge */
    document.msExitFullscreen();
  }
};

export default {
  swiper: null,

  components: {
    ImageInfo,
  },

  data() {
    return {
      visible: false,
      images: [],
      activeDocument: null,
      isFullscreen: false,
    };
  },

  created() {
    // this component is never destroyed, don't need a call to removeListener
    window.addEventListener('keydown', this.onKeydown);
  },

  methods: {
    push(image) {
      if (this.images.findIndex((item) => item.document_id === image.document_id) === -1) {
        this.images.push(image);
      }
    },

    show(image) {
      let initialSlide = this.images.findIndex((item) => item.document_id === image.document_id);

      if (initialSlide === -1) {
        initialSlide = this.images.length;
        this.push(image);
      }

      this.activeDocument = this.images[initialSlide];
      this.visible = true;

      this.$nextTick(function () {
        const slides = this.images;

        const swiperOptions = {
          init: false,
          initialSlide,
          slidesPerView: 1,

          // Disable preloading of all images
          preloadImages: false,
          // Enable lazy loading
          lazy: {
            // enable loading of closest images
            loadPrevNext: true,
          },

          // not possible with virtual
          // https://idangero.us/swiper/api/#virtual
          // loop: true,

          // virtual because it may be too slow if there is too many image
          // test : https://c2corg.github.io/c2c_ui/#/articles/1058594/fr/concours-photo-sophie-2018
          virtual: {
            slides,
            renderSlide(image) {
              return `<div class="swiper-slide image-viewer-slide" style="{left:${this.offset}px}">
                  <img data-src="${imageUrls.getBig(image)}" class="swiper-lazy" title="${image.locales[0].title}">
                  <div class="swiper-lazy-preloader swiper-lazy-preloader-white"/>
                </div>`;
            },
          },

          navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
          },

          keyboard: {
            enabled: true,
          },
        };

        if (this.$options.swiper) {
          this.$options.swiper.destroy();
        }

        this.$options.swiper = new Swiper(this.$refs.swiper, swiperOptions);
        this.$options.swiper.on('slideChange', this.onSlideChange);
        this.$options.swiper.on('init', () => {
          window.history.pushState(null, null, '#swipe-gallery');
          window.addEventListener('popstate', this.close);
          window.addEventListener('wheel', this.close);
        });
        this.$options.swiper.init();
      });
    },

    onPaginationClick(index) {
      this.$options.swiper.slideTo(index, 0, false);
    },

    clear() {
      this.images = [];
      this.close();
    },

    close() {
      this.visible = false;
      window.removeEventListener('popstate', this.close);
      window.removeEventListener('wheel', this.close);
      if (window.location.hash === '#swipe-gallery') {
        window.history.back();
      }
    },

    onKeydown(event) {
      if (event.key === 'Escape') {
        this.close();
      }
    },

    toggleImageInfo(image) {
      this.$refs.imageInfo.toggle(image.document_id);
    },

    onSlideChange() {
      this.$refs.imageInfo.hide();
      this.activeDocument = this.images[this.$refs.swiper.swiper.activeIndex];
    },

    toggleFullscreen() {
      if (this.isFullscreen) {
        exitFullscreen();
      } else {
        requestFullscreen(this.$el);
      }

      this.isFullscreen = !this.isFullscreen;
    },
  },
};
</script>

<style lang="scss">
@import '~swiper/dist/css/swiper.css';

// class not explicitly present in template, can't use scope

.image-viewer-slide {
  max-height: 100%;

  img {
    max-height: 100%;
    max-width: 100%;
    width: auto;
    height: auto;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    margin: auto;
  }
}
</style>

<style scoped lang="scss">
@import '@/assets/sass/variables.scss';

$headerHeight: 52px;
$paginationHeight: 30px;

.image-viewer {
  z-index: 1000;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%; // not 100vw, otherwise the viewer goes under the scrollbar
  height: 100%;
  background: rgba(0, 0, 0, 0.95);

  &-header {
    justify-content: space-between;
    padding: 0.5rem 1rem;
    margin-bottom: 0 !important;

    .image-viewer-title {
      margin: auto;
    }

    .image-viewer-buttons > *:not(:last-child) {
      margin-right: 0.75rem;
    }

    .image-viewer-buttons {
      svg:hover {
        color: white;
      }
    }
  }

  &-swiper {
    width: 100vw;
    height: calc(100% - #{$headerHeight} - #{$paginationHeight});
  }

  &-pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    bottom: 0;
    height: $paginationHeight;

    .image-viewer-bullet:first-child {
      border-bottom-left-radius: 50%;
      border-top-left-radius: 50%;
    }

    .image-viewer-bullet:last-child {
      border-bottom-right-radius: 50%;
      border-top-right-radius: 50%;
    }

    .image-viewer-bullet {
      display: inline-block;
      background: white;
      max-width: 16px;
      height: 16px;
      border: 25% solid black;
    }

    .image-viewer-bullet-active {
      background: $primary;
    }
  }
}

@media screen and (max-width: $tablet) {
  .image-viewer-title {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    text-align: center;
  }

  .image-viewer-buttons {
    position: absolute;
    top: 0;
    right: 1em;
  }
}

.image-viewer-info {
  height: 100vh;
  width: 20rem;
  z-index: 1000;
  position: fixed;
  top: 3.7rem;
  right: 0;
}

.swiper-button-prev {
  margin-left: 1rem;
}
.swiper-button-next {
  margin-right: 1rem;
}
</style>
