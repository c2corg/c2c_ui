<template>
    <div v-if="visible">
        <swiper
            ref="swiper"
            :options="$options.swiperOptions"
            class="image-viewer-swiper"
            @slide-change="onSlideChange">
            <swiper-slide v-for="image of images" :key="image.document_id">
                <gallery-image large :image="image" class="camptocamp-image"/>
            </swiper-slide>
            <div slot="button-prev" class="swiper-button-prev"/>
            <div slot="button-next" class="swiper-button-next"/>
            <div slot="pagination" class="swiper-pagination"/>
        </swiper>

        <div v-if="activeDocument" class="is-size-3 has-text-grey-lighter image-viewer-header">
            <div class="level is-mobile">
                <span class="level-left"/>
                <span class="level-item is-size-2">
                    {{ activeDocument.locales[0].title }}
                </span>
                <span class="level-right">
                    <document-link :document="activeDocument" class="level-item has-text-grey-lighter">
                        <fa-icon icon="eye"/>
                    </document-link>

                    <edit-link
                        :document="activeDocument" :lang="activeDocument.available_langs[0]"
                        class="level-item has-text-grey-lighter">
                        <fa-icon icon="edit"/>
                    </edit-link>

                    <fa-icon
                        class="level-item has-cursor-pointer"
                        icon="info-circle"
                        @click="showInfo = !showInfo"/>
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

        <image-info v-if="showInfo && activeDocument" class="image-viewer-info" :document_id="activeDocument.document_id" />
    </div>

</template>

<script>

    import { swiper, swiperSlide } from 'vue-awesome-swiper'
    import ImageInfo from './ImageInfo'

    const requestFullscreen = function(wrapper) {
        if (wrapper.requestFullscreen) {
            wrapper.requestFullscreen()
        } else if (wrapper.mozRequestFullScreen) { /* Firefox */
            wrapper.mozRequestFullScreen()
        } else if (wrapper.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
            wrapper.webkitRequestFullscreen()
        } else if (wrapper.msRequestFullscreen) { /* IE/Edge */
            wrapper.msRequestFullscreen()
        }
    }

    const exitFullscreen = function() {
        if (document.exitFullscreen) {
            document.exitFullscreen()
        } else if (document.mozCancelFullScreen) { /* Firefox */
            document.mozCancelFullScreen()
        } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
            document.webkitExitFullscreen()
        } else if (document.msExitFullscreen) { /* IE/Edge */
            document.msExitFullscreen()
        }
    }

    export default {

        components: {
            swiper,
            swiperSlide,
            ImageInfo
        },

        data() {
            return {
                visible: false,
                showInfo: false,
                images: [],
                activeDocument: null
            }
        },

        created() {
            // this component is never destroyed, don't need a call to removeListener
            window.addEventListener('keydown', this.onKeydown)
        },

        methods: {

            push(image) {
                if (this.images.findIndex(item => item.document_id === image.document_id) === -1) {
                    this.images.push(image)
                }
            },

            show(image) {
                let index = this.images.findIndex(item => item.document_id === image.document_id)

                if (index === -1) {
                    index = this.images.length
                    this.push(image)
                }

                this.activeDocument = this.images[index]
                this.$options.swiperOptions.initialSlide = index
                this.visible = true
            },

            clear() {
                this.images = []
                this.visible = false
                this.showInfo = false
            },

            onKeydown(event) {
                if (event.key === 'Escape') {
                    this.visible = false
                }
            },

            onSlideChange() {
                this.activeDocument = this.images[this.$refs.swiper.swiper.activeIndex - 1]
            },

            onRequestFullscreen() {
                requestFullscreen(this.$el)
            },

            onExitFullscreen() {
                exitFullscreen()
            }
        },

        swiperOptions: {
            loop: true,
            initialSlide: 0,
            slidesPerView: 1,
            spaceBetween: 15,
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev'
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true
            },
            keyboard: {
                enabled: true
            }
        }
    }
</script>

<style scoped lang="scss">

    @import '~swiper/dist/css/swiper.css';

    $navigation-button-size:2rem;

    .image-viewer-swiper{
        z-index:1000;
        position:fixed;
        top:0;
        left:0;
        width:100vw;
        height:100vh;
        background: rgba(0,0,0,0.9);

        .swiper-slide{
            max-height:80vh;
            margin-top:10vh;

            .camptocamp-image{
            }
        }
    }

    .image-viewer-header{
        z-index:1000;
        position:fixed;
        top:0;
        left:0;
        width:100vw;
        padding:0.5rem 1rem;

        svg:hover{
            color:white;
        }
    }

    .image-viewer-info{
        height:100vh;
        width:20rem;
        z-index:1000;
        position:fixed;
        top:4rem;
        right:0;
    }

    .request-fullscreen-button:fullscreen, .request-fullscreen-button:-webkit-full-screen{
        display: none;
    }

    .exit-fullscreen-button:not(:fullscreen), .exit-fullscreen-button:not(:-webkit-full-screen){
        display: none;
    }

</style>
