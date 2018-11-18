<template>
    <swiper :options="swiperOption" class="swiper">
        <swiper-slide v-for="image of images" :key="image.document_id">
            <img :src="getSmallImageUrl(image)">
        </swiper-slide>
        <div slot="button-prev" class="swiper-button-prev"/>
        <div slot="button-next" class="swiper-button-next"/>
    </swiper>
</template>

<script>

    import { swiper, swiperSlide } from 'vue-awesome-swiper'

    import imageUrls from '@/js/image-urls'

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

        data() {
            return {
                swiperOption: {
                    slidesPerView: 'auto',
                    spaceBetween: 15,
                    navigation:{
                        nextEl: '.swiper-button-next',
                        prevEl: '.swiper-button-prev',
                    }
                },
            }
        },

        methods:{
            getSmallImageUrl: imageUrls.getSmall,
        }
    }
</script>

<style scoped lang="scss">

@import '~swiper/dist/css/swiper.css';

$navigation-button-size:2rem;
.swiper
.swiper-slide img{
    height:200px;
    // display:block;
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

</style>
