<template>
  <div v-if="visible" class="image-viewer" :class="{ 'hide-buttons': hideButtons, 'with-details': hasDetails }">
    <div v-if="hasDetails" class="is-flex has-text-grey-lighter image-viewer-header">
      <span class="is-size-4 is-ellipsed-tablet image-viewer-title">
        {{ activeDocument.locales[0].title || '&nbsp;' }}
      </span>
      <span class="is-size-3 is-nowrap image-viewer-buttons">
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
    </div>

    <div v-if="hasDetails" class="swiper-button-prev">
      <fa-icon icon="arrow-left"></fa-icon>
    </div>
    <div v-if="hasDetails" class="swiper-button-next">
      <fa-icon icon="arrow-right"></fa-icon>
    </div>

    <div v-if="hasDetails" class="image-viewer-pagination is-hidden-mobile">
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

    <image-info v-if="hasDetails" ref="imageInfo" class="image-viewer-info" />
  </div>
</template>

<script>
import SwiperCore, { Keyboard, Lazy, Navigation, Pagination, Virtual, Zoom } from 'swiper/core';
import ZingTouch from 'zingtouch';

import ImageInfo from './ImageInfo';

import imageUrls from '@/js/image-urls';

SwiperCore.use([Keyboard, Lazy, Navigation, Pagination, Virtual, Zoom]);

const requestFullscreen = function (wrapper) {
  if (wrapper.requestFullscreen) {
    wrapper.requestFullscreen();
  } else if (wrapper.webkitRequestFullscreen) {
    /* Safari */
    wrapper.webkitRequestFullscreen();
  }
};

const exitFullscreen = function () {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) {
    /* Safari */
    document.webkitExitFullscreen();
  }
};

export default {
  swiper: null,
  zt: null,

  components: {
    ImageInfo,
  },

  props: {
    size: {
      type: String,
      default: 'big',
      validator: function (value) {
        return ['original', 'big'].includes(value);
      },
    },
  },

  data() {
    return {
      visible: false,
      images: [],
      activeDocument: null,
      isFullscreen: false,
      hideButtons: false,
    };
  },

  computed: {
    hasDetails() {
      return this.size !== 'original';
    },
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

      const getImage = this.getImage;

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
          // https://swiperjs.com/api/#virtual
          // loop: true,

          // virtual because it may be too slow if there is too many image
          // test : https://c2corg.github.io/c2c_ui/#/articles/1058594/fr/concours-photo-sophie-2018
          virtual: {
            slides,
            renderSlide(img) {
              return `<div class="swiper-slide image-viewer-slide">
                  <div class="swiper-zoom-container">
                    <img data-src="${getImage(img)}" class="swiper-lazy" alt="${img.locales[0].title}" loading="lazy">
                  </div>
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

          zoom: true,
        };

        if (this.$options.swiper) {
          this.$options.swiper.destroy();
        }

        this.$options.swiper = new SwiperCore(this.$refs.swiper, swiperOptions);
        this.$options.swiper.on('slideChange', this.onSlideChange);
        this.$options.swiper.on('init', () => {
          window.history.pushState(null, null, '#swipe-gallery');

          // close when the user goes back in history
          window.addEventListener('popstate', this.close);
          // close on mouse wheel
          window.addEventListener('wheel', this.close);
          // close on vertical swipe
          this.zt = new ZingTouch.Region(this.$refs.swiper);
          this.zt.bind(this.$refs.swiper, 'swipe', (event) => {
            const {
              detail: {
                data: [{ currentDirection }],
              },
            } = event;
            const isSwipeTop = currentDirection > 60 && currentDirection < 120;
            const isSwipeBottom = currentDirection > 240 && currentDirection < 300;
            if (isSwipeTop || isSwipeBottom) {
              this.close();
            }
          });
          // close on escape
          window.addEventListener('keydown', this.onKeydown);
        });
        if (this.$screen.isMobile) {
          this.$options.swiper.on('click', this.toggleButtons);
        }
        this.$options.swiper.init();
      });
    },

    getImage(img) {
      switch (this.size) {
        case 'original':
          return imageUrls.get(img);
        case 'big':
        default:
          return imageUrls.getBig(img);
      }
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
      // clean handlers
      window.removeEventListener('popstate', this.close);
      window.removeEventListener('wheel', this.close);
      if (this.zt) {
        this.zt.unbind(this.$refs.container);
        this.zt = null;
      }
      window.removeEventListener('keydown', this.onKeydown);
      this.hideButtons = false;

      // if we closed without hitting back, go back once in history
      // to remove the hash
      if (window.location.hash === '#swipe-gallery') {
        window.history.back();
      }
    },

    onKeydown(event) {
      if (event.key === 'Escape') {
        this.close();
      }
    },

    toggleButtons() {
      this.hideButtons = !this.hideButtons;
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
@import '~swiper/swiper';
@import '~swiper/components/lazy/lazy';
@import '~swiper/components/zoom/zoom';

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
$headerHeight: 3rem;
$paginationHeight: 30px;

.image-viewer {
  z-index: 1000;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%; // not 100vw, otherwise the viewer goes under the scrollbar
  height: 100%;
  background: rgba(0, 0, 0);

  &-header {
    justify-content: space-between;
    padding: 0.5rem 1rem;
    margin-bottom: 0 !important;
    height: $headerHeight;

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
    height: 100%;
  }

  &-pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    bottom: 0;
    height: $paginationHeight;

    .image-viewer-bullet {
      display: inline-block;
      background: white;
      max-width: 16px;
      height: 16px;
      border: 25% solid black;

      &:first-child {
        border-bottom-left-radius: 50%;
        border-top-left-radius: 50%;
      }

      &:last-child {
        border-bottom-right-radius: 50%;
        border-top-right-radius: 50%;
      }
    }

    .image-viewer-bullet-active {
      background: $primary;
    }
  }

  .swiper-button-prev,
  .swiper-button-next,
  .image-viewer-pagination,
  .image-viewer-buttons {
    visibility: visible;
    opacity: 1;
    transition: visibility 1s, opacity 1s;
  }

  &.hide-buttons {
    .swiper-button-prev,
    .swiper-button-next,
    .image-viewer-pagination,
    .image-viewer-buttons {
      visibility: hidden;
      opacity: 0;
    }
  }
}

.image-viewer.with-details {
  background: rgba(0, 0, 0, 0.95);
  .image-viewer-swiper {
    // on mobile, we don't have pagination, but this will give enough space to display
    // the title on one line.
    height: calc(100% - #{$headerHeight} - #{$paginationHeight});
  }
}

@media screen and (max-width: $tablet) {
  .image-viewer-title {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    text-align: center;
    // since mobile are small, we don't do text ellipsis and allow multi line text
    // make it displayed on top of the image, and with some alpha background in case it
    // overlaps the image
    z-index: 2;
    background: rgba(0, 0, 0, 0.6);
  }

  .image-viewer-buttons {
    position: fixed;
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

$swiper-navigation-size: 4rem;

.swiper-button-prev {
  left: 0;
  right: auto;
}
.swiper-button-next {
  left: auto;
  right: 0;
}

.swiper-button-prev,
.swiper-button-next {
  position: absolute;
  top: 50%;
  font-size: $swiper-navigation-size * 0.5;
  width: $swiper-navigation-size;
  height: $swiper-navigation-size;
  margin-top: -$swiper-navigation-size * 0.5;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: $white;

  &.swiper-button-disabled {
    cursor: auto;
    pointer-events: none;
    color: $grey;
  }
}
</style>
