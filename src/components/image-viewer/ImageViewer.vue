<template>
  <div v-if="visible" class="image-viewer">
    <div class="level is-mobile has-text-grey-lighter image-viewer-header">
      <span class="level-item is-size-2">
        {{ activeDocument.locales[0].title || '&nbsp;' }}
      </span>
      <span class="level-right is-size-3">
        <document-link :document="activeDocument" class="level-item has-text-grey-lighter">
          <fa-icon icon="eye"/>
        </document-link>

        <edit-link
          :document="activeDocument" :lang="activeDocument.available_langs[0]"
          class="level-item has-text-grey-lighter"
          @click="visible=false">
          <fa-icon icon="edit"/>
        </edit-link>

        <fa-icon
          class="level-item has-cursor-pointer"
          icon="info-circle"
          @click="toggleImageInfo(activeDocument)"/>
        <fa-icon
          class="level-item has-cursor-pointer request-fullscreen-button"
          icon="expand"
          @click="onRequestFullscreen"/>
        <fa-icon
          class="level-item has-cursor-pointer exit-fullscreen-button"
          icon="compress"
          @click="onExitFullscreen"/>
        <fa-icon
          class="level-item has-cursor-pointer"
          icon="plus"
          transform="rotate-45"
          @click="visible=false"/>
      </span>
    </div>

    <div ref="swiper" class="image-viewer-swiper">
      <div class="swiper-wrapper"/>
      <div class="swiper-button-prev"/>
      <div class="swiper-button-next"/>
      <div class="swiper-pagination" @click="onPaginationClick"/>
    </div>

    <image-info ref="imageInfo" class="image-viewer-info" />

  </div>

</template>

<script>
  import Swiper from 'swiper/dist/js/swiper.esm.bundle';

  import imageUrls from '@/js/image-urls';
  import ImageInfo from './ImageInfo';

  const requestFullscreen = function(wrapper) {
    if (wrapper.requestFullscreen) {
      wrapper.requestFullscreen();
    } else if (wrapper.mozRequestFullScreen) { /* Firefox */
      wrapper.mozRequestFullScreen();
    } else if (wrapper.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
      wrapper.webkitRequestFullscreen();
    } else if (wrapper.msRequestFullscreen) { /* IE/Edge */
      wrapper.msRequestFullscreen();
    }
  };

  const exitFullscreen = function() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) { /* Firefox */
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { /* IE/Edge */
      document.msExitFullscreen();
    }
  };

  export default {

    swiper: null,

    components: {
      ImageInfo
    },

    data() {
      return {
        visible: false,
        images: [],
        activeDocument: null
      };
    },

    created() {
      // this component is never destroyed, don't need a call to removeListener
      window.addEventListener('keydown', this.onKeydown);
    },

    methods: {
      push(image) {
        if (this.images.findIndex(item => item.document_id === image.document_id) === -1) {
          this.images.push(image);
        }
      },

      show(image) {
        let initialSlide = this.images.findIndex(item => item.document_id === image.document_id);

        if (initialSlide === -1) {
          initialSlide = this.images.length;
          this.push(image);
        }

        this.activeDocument = this.images[initialSlide];
        this.visible = true;

        this.$nextTick(function() {
          const slides = this.images;

          const swiperOptions = {
            initialSlide,
            slidesPerView: 1,

            // Disable preloading of all images
            preloadImages: false,
            // Enable lazy loading
            lazy: {
              // enable loading of closest images
              loadPrevNext: true
            },

            // not possible with virtual
            // https://idangero.us/swiper/api/#virtual
            // loop: true,

            // virtual because it may be too slow if there is too many image
            // test : https://c2corg.github.io/c2c_ui/#/articles/1058594/fr/concours-photo-sophie-2018
            virtual: {
              slides,
              renderSlide(image, index) {
                return `<div class="swiper-slide image-viewer-slide" style="{left:${this.offset}px}">
                  <img data-src="${imageUrls.getBig(image)}" class="swiper-lazy" title="${image.locales[0].title}">
                  <div class="swiper-lazy-preloader swiper-lazy-preloader-white"/>
                </div>`;
              }
            },

            navigation: {
              nextEl: '.swiper-button-next',
              prevEl: '.swiper-button-prev'
            },

            // https://idangero.us/swiper/api/#pagination
            pagination: {
              el: '.swiper-pagination',

              // clickable is a performance killer.
              // try on chrome with https://c2corg.github.io/c2c_ui/#/articles/1058594/fr/concours-photo-sophie-2018
              // so we handle ourself click on pagination bullet (see onPaginationClick())
              // clickable: true,

              renderBullet(index, className) {
                return `<span
                  class="${className} has-cursor-pointer"
                  data-pagination-slide-index="${index}"
                  title="${slides[index].locales[0].title}"></span>`;
              }
            },

            keyboard: {
              enabled: true
            }
          };

          if (this.$options.swiper) {
            this.$options.swiper.destroy();
          }

          this.$options.swiper = new Swiper(this.$refs.swiper, swiperOptions);
          this.$options.swiper.on('slideChange', this.onSlideChange);
        });
      },

      onPaginationClick() {
        const attribute = event.target.attributes['data-pagination-slide-index'];

        if (attribute !== undefined) {
          this.$options.swiper.slideTo(parseInt(attribute.value, 10), 0, false);
        }
      },

      clear() {
        this.images = [];
        this.visible = false;
      },

      onKeydown(event) {
        if (event.key === 'Escape') {
          this.visible = false;
        }
      },

      toggleImageInfo(image) {
        this.$refs.imageInfo.toggle(image.document_id);
      },

      onSlideChange() {
        this.$refs.imageInfo.hide();
        this.activeDocument = this.images[this.$refs.swiper.swiper.activeIndex];
      },

      onRequestFullscreen() {
        requestFullscreen(this.$el);
      },

      onExitFullscreen() {
        exitFullscreen();
      }
    }
  };
</script>

<style lang="scss">
  @import '@/assets/sass/variables.scss';

  .swiper-pagination{
    padding: 0 1.5rem;

    .swiper-pagination-bullet{
      background: white;
      opacity: 1;
      margin: 0 2px!important;
      width: 10px;
      height: 10px;
    }

    .swiper-pagination-bullet-active{
      background: $primary;
    }
  }

  .image-viewer-slide{
    max-height:100vh;

    img{
      max-height: 80vh;
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

  @import '~swiper/dist/css/swiper.css';

  .image-viewer{
    z-index:1000;
    position:fixed;
    top:0;
    left:0;
    width:100vw;
    height:100vh;
    background: rgba(0,0,0,0.9);

    .image-viewer-header{
      padding:0.5rem 1rem;
      background: rgba(0,0,0,0.9);
      margin-bottom: 0!important;

      svg:hover{
        color:white;
      }
    }

    .image-viewer-swiper{
      width:100vw;
      height:calc(100vh - 3.8rem);
    }
  }

  .image-viewer-info{
      height:100vh;
      width:20rem;
      z-index:1000;
      position:fixed;
      top:3.7rem;
      right:0;
  }

  .request-fullscreen-button:fullscreen{
      display: none;
  }

  .exit-fullscreen-button:not(:fullscreen){
      display: none;
  }

  .swiper-button-prev{
      margin-left: 1rem;
  }
  .swiper-button-next{
      margin-right: 1rem;
  }

</style>
