<template>
  <div v-if="visible && activeDocument" ref="root" class="image-viewer" :class="{ 'hide-buttons': hideButtons }">
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
          :lang="activeDocument.available_langs?.[0]"
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
            <img :src="image.imgSrc" :alt="image.locales[0].title ?? undefined" loading="lazy" />
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
        :title="image.locales[0].title ?? undefined"
        @click="onPaginationClick(index)"
        :style="`width: calc((100vw - 1.5rem) / ${images.length});`"
      />
    </div>

    <image-info ref="infoPanel" class="image-viewer-info" />
  </div>
</template>

<script setup lang="ts">
import Swiper, { Keyboard, Navigation, Pagination, Virtual, Zoom } from 'swiper';
import { nextTick, onBeforeUnmount, ref, useTemplateRef } from 'vue';
import ZingTouch from 'zingtouch';

import ImageInfo from './ImageInfo.vue';

import { useGlobalProperties } from '@/js/composables/global-properties';
import { getImageUrl } from '@/js/image-urls';
import throttle from '@/js/throttle';
import { registerImageViewer, type ViewerImage } from '@/js/vue-plugins/image-viewer';

type SwiperContainer = HTMLElement & { swiper: Swiper; initialize(): void };
type ShownImage = ViewerImage & { imgSrc?: string; avifSrc?: string; webpSrc?: string };
// Safari
type WebkitFullscreen = { webkitRequestFullscreen?(): void; webkitExitFullscreen?(): void };

const requestFullscreen = function (wrapper: HTMLElement & WebkitFullscreen) {
  if (wrapper.requestFullscreen) {
    wrapper.requestFullscreen();
  } else if (wrapper.webkitRequestFullscreen) {
    /* Safari */
    wrapper.webkitRequestFullscreen();
  }
};

const exitFullscreen = function () {
  const doc = document as Document & WebkitFullscreen;
  if (doc.exitFullscreen) {
    doc.exitFullscreen();
  } else if (doc.webkitExitFullscreen) {
    /* Safari */
    doc.webkitExitFullscreen();
  }
};

const { $screen } = useGlobalProperties();

const visible = ref(false);
const images = ref<ShownImage[]>([]);
const activeDocument = ref<ShownImage | null>(null);
const isFullscreen = ref(false);
const hideButtons = ref(false);

const root = useTemplateRef<HTMLElement>('root');
const swiper = useTemplateRef<SwiperContainer>('swiper');
const infoPanel = useTemplateRef<{ hide(): void; toggle(documentId: number): void }>('infoPanel');
let zt: InstanceType<typeof ZingTouch.Region> | null = null;

function push(image: ViewerImage) {
  if (images.value.findIndex((item) => item.document_id === image.document_id) === -1) {
    images.value.push({
      ...image,
      imgSrc: getImageUrl(image, 'BI'),
      avifSrc: getImageUrl(image, 'BI', 'avif'),
      webpSrc: getImageUrl(image, 'BI', 'webp'),
    });
  }
}

function close() {
  visible.value = false;
  // clean handlers
  window.removeEventListener('popstate', close);
  window.removeEventListener('wheel', close);
  if (zt) {
    // the swiper element, still there until the viewer is hidden (was $refs.container, which did not exist)
    if (swiper.value) {
      zt.unbind(swiper.value);
    }
    zt = null;
  }
  hideButtons.value = false;
}

function toggleButtons() {
  hideButtons.value = !hideButtons.value;
}

function show(image: ViewerImage) {
  let initialSlide = images.value.findIndex((item) => item.document_id === image.document_id);

  if (initialSlide === -1) {
    initialSlide = images.value.length;
    push(image);
  }

  activeDocument.value = images.value[initialSlide];
  visible.value = true;

  nextTick(() => {
    const element = swiper.value!;
    const swiperParams = {
      modules: [Keyboard, Navigation, Pagination, Virtual, Zoom],
      injectStylesUrls: [
        '/swiper/navigation-element.min.css',
        '/swiper/pagination-element.min.css',
        '/swiper/virtual-element.min.css',
        '/swiper/zoom-element.min.css',
      ],
      initialSlide,
      // here and not as attributes: Vue 3 sets them as properties of <swiper-container>, as strings ("true"), which
      // Swiper doesn't take as enabled
      keyboard: true,
      zoom: true,

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

    element.addEventListener('init', () => {
      // close when the user goes back in history
      window.addEventListener('popstate', close);
      // close on mouse wheel
      window.addEventListener('wheel', close);
      // close on vertical swipe
      zt = new ZingTouch.Region(element);
      zt.bind(element, 'swipe', (event) => {
        const {
          detail: {
            data: [{ currentDirection }],
          },
        } = event;
        const isSwipeTop = currentDirection > 60 && currentDirection < 120;
        const isSwipeBottom = currentDirection > 240 && currentDirection < 300;
        if (isSwipeTop || isSwipeBottom) {
          close();
        }
      });
    });
    if ($screen.isMobile) {
      // no idea why toggleButtons is called twice, so we throttle...
      element.addEventListener('click', throttle(toggleButtons, 150));
    }
    Object.assign(element, swiperParams);
    element.initialize();
  });
}

function onPaginationClick(index: number) {
  swiper.value!.swiper.slideTo(index, 0, false);
}

function clear() {
  images.value = [];
  close();
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    close();
  }
}

function toggleImageInfo(image: ShownImage) {
  infoPanel.value!.toggle(image.document_id);
}

function onSlideChange() {
  infoPanel.value!.hide();
  activeDocument.value = images.value[swiper.value!.swiper.activeIndex];
}

function toggleFullscreen() {
  if (isFullscreen.value) {
    exitFullscreen();
  } else {
    requestFullscreen(root.value!);
  }

  isFullscreen.value = !isFullscreen.value;
}

// in setup, not mounted(): pages call it while they are created, before the app tree is mounted
registerImageViewer({ push, show, clear });
// this component is never destroyed, don't need a call to removeListener
window.addEventListener('keydown', onKeydown);

onBeforeUnmount(() => {
  registerImageViewer(null);
});
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
    transition:
      visibility 1s,
      opacity 1s;
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
