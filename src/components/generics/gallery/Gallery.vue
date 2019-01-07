<template>
    <div>
        <swiper :options="$options.swiperOption" class="swiper">
            <swiper-slide v-for="(image, i) of images" :key="image.document_id">
                <gallery-image :image="image" class="camptocamp-image" @click="activateLargeView(i)"/>
            </swiper-slide>
            <div slot="button-prev" class="swiper-button-prev"/>
            <div slot="button-next" class="swiper-button-next"/>
        </swiper>

        <div ref="largeViewWrapper" v-if="largeView">
            <swiper
                ref="largeViewSwiper"
                :options="$options.largeViewSwiperOption"
                class="large-view-swiper"
                @slide-change="onSlideChange">
                <swiper-slide v-for="image of images" :key="image.document_id">
                    <gallery-image large :image="image" class="camptocamp-image"/>
                </swiper-slide>
                <div slot="button-prev" class="swiper-button-prev"/>
                <div slot="button-next" class="swiper-button-next"/>
                <div slot="pagination" class="swiper-pagination"/>
            </swiper>

            <div class="is-size-3 has-text-grey-lighter swiper-large-view-header">
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
                            @click="largeView=false"/>
                    </span>
                </div>
            </div>

            <image-info v-if="showInfo" class="swiper-info" :document_id="activeDocument.document_id" />
        </div>
    </div>

</template>

<script>

    import { swiper, swiperSlide } from 'vue-awesome-swiper'

    export default {

        components: {
            swiper,
            swiperSlide
        },

        props: {
            images: {
                type: Array,
                required: true
            }
        },

        data() {
            return {
                largeView: false,
                showInfo: false,
                activeIndex: 0 // read only
            }
        },

        computed: {
            activeDocument() {
                return this.images[this.activeIndex]
            }
        },

        created() {
            window.addEventListener('keydown', this.onKeydown)
        },

        beforeDestroy() {
            window.removeEventListener('keydown', this.onKeydown)
        },

        methods: {
            onKeydown(event) {
                if (event.key === 'Escape') {
                    this.largeView = false
                }
            },
            activateLargeView(initialSlide) {
                this.$options.largeViewSwiperOption.initialSlide = initialSlide
                this.activeIndex = initialSlide
                this.largeView = true
            },

            showFullscreen(imageId) {
                for (const i in this.images) {
                    if (this.images[i].document_id === imageId) {
                        this.activateLargeView(i)
                        break
                    }
                }
            },

            onSlideChange() {
                this.activeIndex = this.$refs.largeViewSwiper.swiper.activeIndex
            },
            onRequestFullscreen() {
                if (this.$refs.largeViewWrapper.requestFullscreen) {
                    this.$refs.largeViewWrapper.requestFullscreen()
                } else if (this.$el.mozRequestFullScreen) { /* Firefox */
                    this.$refs.largeViewWrapper.mozRequestFullScreen()
                } else if (this.$el.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
                    this.$refs.largeViewWrapper.webkitRequestFullscreen()
                } else if (this.$el.msRequestFullscreen) { /* IE/Edge */
                    this.$refs.largeViewWrapper.msRequestFullscreen()
                }
            },
            onExitFullscreen() {
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
        },

        swiperOption: {
            slidesPerView: 'auto',
            spaceBetween: 15,
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev'
            }
        },

        largeViewSwiperOption: {
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
    .swiper{
        .swiper-slide{
            height:200px;
            // display:block;
        }

        .camptocamp-image{
            height:200px;
        }

        //
        .swiper-slide{
            // width:200px;
            width:auto;
        }

        .swiper-button-prev, .swiper-button-next{
            background:rgba(256,256,256,0.9);
            width:$navigation-button-size;
            height:2*$navigation-button-size;
        }

        .swiper-button-prev{
            left:0px;
            border-top-right-radius:$navigation-button-size;
            border-bottom-right-radius:$navigation-button-size;
        }

        .swiper-button-next{
            right:0px;
            border-top-left-radius:$navigation-button-size;
            border-bottom-left-radius:$navigation-button-size;
        }

        .swiper-button-disabled{
            opacity:100;
        }
    }

    .swiper-large-view-header{
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

    .swiper-info{
        height:100vh;
        width:20rem;
        z-index:1000;
        position:fixed;
        top:4rem;
        right:0;
    }

    .large-view-swiper{
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

    .request-fullscreen-button:fullscreen, .request-fullscreen-button:-webkit-full-screen{
        display: none;
    }

    .exit-fullscreen-button:not(:fullscreen), .exit-fullscreen-button:not(:-webkit-full-screen){
        display: none;
    }

</style>
