<template>
    <swiper :options="$options.swiperOption" class="swiper">
        <swiper-slide v-for="image of images" :key="image.document_id">
            <gallery-image :image="image" class="camptocamp-image" @click="$imageViewer.show(image)"/>
        </swiper-slide>
    </swiper>

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

        created() {
            this.images.map(this.$imageViewer.push)
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

        .swiper-button-disabled{
            opacity:100;
        }
    }
</style>
