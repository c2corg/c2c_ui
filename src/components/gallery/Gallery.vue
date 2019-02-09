<template>
    <swiper :options="$options.swiperOption" class="swiper">
        <swiper-slide v-for="image of images" :key="image.document_id">
            <img :src="getUrl(image)" :title="image.locales[0].title" @click="$imageViewer.show(image)">
        </swiper-slide>
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
                type: Array,
                required: true
            }
        },

        created() {
            this.images.map(this.$imageViewer.push)
        },

        methods: {
            getUrl(image) {
                return imageUrls.getMedium(image)
            }
        },

        swiperOption: {
            slidesPerView: 'auto',
            spaceBetween: 15
        }
    }
</script>

<style scoped lang="scss">

    @import '~swiper/dist/css/swiper.css';

    .swiper{
        .swiper-slide{
            height:200px;
            width:auto;

            img{
                height:200px;
            }
        }

        .swiper-button-disabled{
            opacity:100;
        }
    }
</style>
