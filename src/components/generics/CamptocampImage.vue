<template>
    <div :class="{'is-loading':loading, 'is-error':error}">
        <fa-icon v-if="loading && !error" :icon="['far', 'hourglass']" spin/>
        <img v-if="!error" :src="src" @load="loading=false" @error="error=true">
        <fa-icon v-if="error" icon="ban"/>
    </div>
</template>

<script>

    import imageUrls from '@/js/image-urls'

    export default {
        props: {
            image: {
                type:Object,
                required:true,
            },
        },

        data(){
            return {
                src: imageUrls.getSmall(this.image),
                loading:true,
                error:false,
            }
        }
    }
</script>

<style scoped lang="scss">
    div{
        height:200px;
        position:relative;

        img{
            height:200px;
        }

        svg{
            position:absolute;
            color:#CCC;
            font-size:40px;
            left:130px;
            top:80px;
        }
    }

    .is-loading{
        background: #EEE;
        width:300px;
    }

</style>
