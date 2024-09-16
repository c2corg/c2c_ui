<template>
  <div v-if="visible" class="image-viewer" :class="{ 'hide-buttons': hideButtons }">
    <div class="is-flex has-text-grey-lighter image-viewer-header">
      <span class="is-size-4 is-ellipsed-tablet image-viewer-title">
        {{ activeDocument.locales[0].title }}
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

    <swiper-container
      init="false"
      keyboard="true"
      zoom="true"
      :slides-per-view="1"
      ref="swiper"
      class="image-viewer-swiper"
      @slidechange="onSlideChange"
    >
      <swiper-slide class="image-viewer-slide" v-for="image of images" :key="image.document_id">
        <div class="swiper-zoom-container">
          <picture>
            <source v-if="image.avifSrc" type="image/avif" :srcset="image.avifSrc" />
            <source v-if="image.webpSrc" type="image/webp" :srcset="image.webpSrc" />
            <img :src="image.imgSrc" :alt="image.locales[0].title" loading="lazy" />
          </picture>
        </div>
      </swiper-slide>
    </swiper-container>

    <div class="swiper-button-prev">
      <fa-icon icon="arrow-left"></fa-icon>
    </div>
    <div class="swiper-button-next">
      <fa-icon icon="arrow-right"></fa-icon>
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
import { Keyboard, Navigation, Pagination, Virtual, Zoom } from 'swiper';
import ZingTouch from 'zingtouch';

import ImageInfo from './ImageInfo';

import { getImageUrl } from '@/js/image-urls';
import throttle from '@/js/throttle';

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

  data() {
    return {
      visible: false,
      images: [],
      activeDocument: null,
      isFullscreen: false,
      hideButtons: false,
    };
  },

  created() {
    // this component is never destroyed, don't need a call to removeListener
    window.addEventListener('keydown', this.onKeydown);
  },

  methods: {
    push(image) {
      if (this.images.findIndex((item) => item.document_id === image.document_id) === -1) {
        this.images.push({
          ...image,
          imgSrc: getImageUrl(image, 'BI'),
          avifSrc: getImageUrl(image, 'BI', 'avif'),
          webpSrc: getImageUrl(image, 'BI', 'webp'),
        });
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
        const swiperParams = {
          modules: [Keyboard, Navigation, Pagination, Virtual, Zoom],
          injectStylesUrls: [
            '/swiper/navigation-element.min.css',
            '/swiper/pagination-element.min.css',
            '/swiper/virtual-element.min.css',
            '/swiper/zoom-element.min.css',
          ],
          initialSlide,

          // virtual because it may be too slow if there are too many images, e.g. /articles/1058594/fr/concours-photo-sophie-2018
          virtual: true,
          navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
          },
          pagination: {
            el: '.image-viewer-pagination',
            type: 'custom',
          },
        };

        this.$refs.swiper.addEventListener('init', () => {
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
        });
        if (this.$screen.isMobile) {
          // no idea why toggleButtons is called twice, so we throttle...
          this.$refs.swiper.addEventListener('click', throttle(this.toggleButtons, 150));
        }
        Object.assign(this.$refs.swiper, swiperParams);
        this.$refs.swiper.initialize();
      });
    },

    onPaginationClick(index) {
      this.$refs.swiper.swiper.slideTo(index, 0, false);
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
      this.hideButtons = false;
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
  background: rgba(0, 0, 0, 0.95);

  &-header {
    position: absolute;
    left: 0;
    right: 0;
    z-index: 3;
    justify-content: space-between;
    padding: 0.5rem 1rem;
    margin-bottom: 0 !important;
    height: $headerHeight;

    .image-viewer-title {
      margin: auto;
      // display title on top of the image with some alpha background
      // in case it overlaps (eg when zooming or on mobile)
      z-index: 2;
      background: rgba(0, 0, 0, 0.4);
      border-radius: 10px;
      padding: 0 10px;
    }

    .image-viewer-buttons > *:not(:last-child) {
      margin-right: 0.75rem;
    }

    .image-viewer-buttons > * {
      // keep the buttons visible when they overlap the image
      filter: drop-shadow(2px 2px 2px black);
      svg:hover {
        color: white;
      }
    }
  }

  // the img container
  &-swiper {
    position: absolute;
    left: 0px;
    top: 0px;
    z-index: 0;
    width: 100vw;
    height: 100%;

    @media screen and (min-width: $tablet) {
      & .swiper-zoom-container {
        // adjust the initial centering of the img to avoid overlap with 1st line of title
        margin-top: 10px;
      }
    }
  }

  &-slide {
    overflow: hidden;

    img {
      // initially avoid overlap with title & scroll, but this is overridden when zooming
      max-height: calc(100vh - #{$headerHeight} - #{$paginationHeight});
    }
  }

  &-pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    bottom: 0;
    height: $paginationHeight;
    position: fixed;

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

@media screen and (max-width: $tablet) {
  .image-viewer-header .image-viewer-title {
    position: fixed;
    // on mobile, title is below to avoid overlap with the toolbox
    bottom: 0;
    left: 0;
    width: 100%;
    text-align: center;
    border-radius: unset;
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
  top: 3rem;
  right: 0;
}

$swiper-navigation-size: 4rem;

.swiper-button-prev {
  left: 0;
  right: auto;

  &::after {
    content: unset;
  }
}
.swiper-button-next {
  left: auto;
  right: 0;

  &::after {
    content: unset;
  }
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
