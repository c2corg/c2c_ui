<template>
    <div>
        <swiper :options="$options.swiperOption" class="swiper">
            <swiper-slide v-for="(image, i) of images" :key="image.document_id">
                <gallery-image :image="image" class="camptocamp-image" @click="activateFullscreen(i)"/>
            </swiper-slide>
            <div slot="button-prev" class="swiper-button-prev"/>
            <div slot="button-next" class="swiper-button-next"/>
        </swiper>

        <swiper
            v-if="fullscreen"
            ref="fullscreenSwiper"
            :options="$options.fullScreenSwiperOption"
            class="fullscreen-swiper"
            @slide-change="onSlideChange">
            <swiper-slide v-for="image of images" :key="image.document_id">
                <gallery-image large :image="image" class="camptocamp-image"/>
            </swiper-slide>
            <div slot="button-prev" class="swiper-button-prev"/>
            <div slot="button-next" class="swiper-button-next"/>
            <div slot="pagination" class="swiper-pagination"/>
        </swiper>

        <div v-if="fullscreen" class="is-size-3 has-text-grey-lighter swiper-fullscreen-header">
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

                    <fa-icon class="level-item has-cursor-pointer" icon="info-circle" @click="showInfo = !showInfo"/>
                    <fa-icon class="level-item has-cursor-pointer" icon="expand"/>
                    <fa-icon class="level-item has-cursor-pointer" icon="plus" transform="rotate-45" @click="fullscreen=false"/>
                </span>
            </div>
        </div>

        <image-info v-if="fullscreen && showInfo" class="swiper-info" :document_id="activeDocument.document_id" />

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
                type:Array,
                required:true,
            }
        },

        data(){
            return {
                fullscreen:false,
                showInfo:false,
                activeIndex:0, // read only
            }
        },

        computed:{
            activeDocument(){
                return this.images[this.activeIndex]
            }
        },

        created(){
            window.addEventListener("keydown", this.onKeydown)
        },

        beforeDestroy(){
            window.removeEventListener("keydown", this.onKeydown)
        },

        methods:{
            onKeydown(event){
                if(event.key=="Escape")
                    this.fullscreen = false
            },
            activateFullscreen(initialSlide){
                this.$options.fullScreenSwiperOption.initialSlide = initialSlide
                this.activeIndex = initialSlide
                this.fullscreen = true
            },
            onSlideChange(){
                this.activeIndex = this.$refs.fullscreenSwiper.swiper.activeIndex
            }
        },

        swiperOption: {
            slidesPerView: 'auto',
            spaceBetween: 15,
            navigation:{
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            }
        },

        fullScreenSwiperOption: {
            initialSlide:0,
            slidesPerView: 1,
            spaceBetween: 15,
            navigation:{
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev',
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true,
            },
            keyboard: {
              enabled: true,
            },
        },
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

    .swiper-fullscreen-header{
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

    .fullscreen-swiper{
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

</style>
