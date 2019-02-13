<template>
  <div v-if="visible">
    <swiper
      ref="swiper"
      :options="$options.swiperOptions"
      class="image-viewer-swiper"
      @slide-change="onSlideChange">

      <swiper-slide v-for="image of images" :key="image.document_id">

        <div class="is-size-3 has-text-grey-lighter image-viewer-header">
          <div class="level is-mobile">
            <span class="level-item is-size-2">
              {{ image.locales[0].title }}
            </span>
            <span class="level-right">
              <document-link :document="image" class="level-item has-text-grey-lighter">
                <fa-icon icon="eye"/>
              </document-link>

              <edit-link
                :document="image" :lang="image.available_langs[0]"
                class="level-item has-text-grey-lighter">
                <fa-icon icon="edit"/>
              </edit-link>

              <fa-icon
                class="level-item has-cursor-pointer"
                icon="info-circle"
                @click="showInfo(image)"/>
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
        </div>

        <img :data-src="getUrl(image)" class="swiper-lazy" :title="image.locales[0].title">
        <div class="swiper-lazy-preloader swiper-lazy-preloader-white"/>
      </swiper-slide>

      <div slot="button-prev" class="swiper-button-prev"/>
      <div slot="button-next" class="swiper-button-next"/>
      <div slot="pagination" class="swiper-pagination"/>
    </swiper>

    <image-info ref="imageInfo" class="image-viewer-info" />
  </div>

</template>

<script>

  import { swiper, swiperSlide } from 'vue-awesome-swiper';

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

    components: {
      swiper,
      swiperSlide,
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
        let index = this.images.findIndex(item => item.document_id === image.document_id);

        if (index === -1) {
          index = this.images.length;
          this.push(image);
        }

        this.$options.swiperOptions.initialSlide = index;
        this.visible = true;
      },

      clear() {
        this.images = [];
        this.visible = false;
      },

      getUrl(image) {
        return imageUrls.getBig(image);
      },

      onKeydown(event) {
        if (event.key === 'Escape') {
          this.visible = false;
        }
      },

      showInfo(image) {
        this.$refs.imageInfo.show(image.document_id);
      },

      onSlideChange() {
        this.$refs.imageInfo.hide();
        this.activeDocument = this.images[this.$refs.swiper.swiper.activeIndex - 1];
      },

      onRequestFullscreen() {
        requestFullscreen(this.$el);
      },

      onExitFullscreen() {
        exitFullscreen();
      }
    },

    swiperOptions: {
      // Disable preloading of all images
      preloadImages: false,
      // Enable lazy loading
      lazy: {
        // enable loading of closest images
        loadPrevNext: true
      },

      loop: true,
      initialSlide: 0,
      slidesPerView: 1,
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev'
      },

      // https://idangero.us/swiper/api/#pagination
      pagination: {
        el: '.swiper-pagination',
        clickable: true
      },
      keyboard: {
        enabled: true
      }
    }
  };
</script>

<style lang="scss">
    @import '@/assets/sass/variables.scss';

    .swiper-pagination{
        .swiper-pagination-bullet{
            background: white;
            opacity: 1;
            width: 16px;
            height: 16px;
        }

        .swiper-pagination-bullet-active{
            background: $primary;
        }
    }
</style>

<style scoped lang="scss">

    @import '~swiper/dist/css/swiper.css';

    .image-viewer-swiper{
        z-index:1000;
        position:fixed;
        top:0;
        left:0;
        width:100vw;
        height:100vh;
        background: rgba(0,0,0,0.9);

        .swiper-slide{
            max-height:100vh;
            // background: yellow;

            .image-viewer-header{
                padding:0.5rem 1rem;
                background: rgba(0,0,0,0.8);

                svg:hover{
                    color:white;
                }
            }

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
    }

    .image-viewer-info{
        height:100vh;
        width:20rem;
        z-index:1000;
        position:fixed;
        top:3.7rem;
        right:0;
    }

    .request-fullscreen-button:fullscreen, .request-fullscreen-button:-webkit-full-screen{
        display: none;
    }

    .exit-fullscreen-button:not(:fullscreen), .exit-fullscreen-button:not(:-webkit-full-screen){
        display: none;
    }

    .swiper-button-prev{
        margin-left: 1rem;
    }
    .swiper-button-next{
        margin-right: 1rem;
    }

</style>
