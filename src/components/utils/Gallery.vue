<template>
    <swiper :options="swiperOption">
        <swiper-slide v-for="image of images" v-bind:key="image.document_id">
            <img :src="getSmallImageUrl(image)">
        </swiper-slide>
    </swiper>
</template>

<script>

    import 'swiper/dist/css/swiper.css'
    import { swiper, swiperSlide } from 'vue-awesome-swiper'

    import c2c from '@/js/c2c.js'

    export default {
        props: ['images'],

        components: {
            swiper,
            swiperSlide
          },

        data() {
            return {
                swiperOption: {
                    slidesPerView: 'auto',
                    spaceBetween: 5
                },

                getSmallImageUrl : c2c.getSmallImageUrl,

            }
        }
    }
</script>

<style>


.swiper-slide img{
height:200px;
}

.swiper-slide{
width:auto;
}

</style>
