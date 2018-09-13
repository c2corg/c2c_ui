<template>
    <swiper :options="swiperOption">
        <swiper-slide v-for="image of images" :key="image.document_id">
            <img :src="c2c.getSmallImageUrl(image)">
        </swiper-slide>
        <div slot="button-prev" class="swiper-button-prev"/>
        <div slot="button-next" class="swiper-button-next"/>
    </swiper>
</template>

<script>

    import { swiper, swiperSlide } from 'vue-awesome-swiper'

    import c2c from '@/js/c2c.js'

    export default {

        components: {
            swiper,
            swiperSlide
          },
        props: ['images'],

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
                c2c,
            }
        }
    }
</script>

<style scoped lang="scss">

@import '~swiper/dist/css/swiper.css';

$navigation-button-size:2rem;
.swiper-slide img{
    height:200px;
    display:block;
}

.swiper-slide{
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
