<template>
    <div :class="{'is-loading':loading, 'is-error':error, 'large-c2c-image': large}">
        <fa-icon v-if="loading && !error" :icon="['far', 'hourglass']" spin/>
        <img
            v-if="!error"
            :src="src"
            @load="loading=false"
            @error="error=true"
            :class="{'large-c2c-image': large}"
            @click="$emit('click', image)">
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

            large: {
                type:Boolean,
                default:false,
            }
        },

        data(){
            return {
                src:null,
                loading:true,
                error:false,
            }
        },

        watch:{
            large: {
                handler : "reset",
                immediate: true,
            }
        },

        methods:{
            reset(){
                this.loading = true
                this.error = false,
                this.src = this.large ? imageUrls.get(this.image) : imageUrls.getSmall(this.image)
            }
        }

    }
</script>

<style scoped lang="scss">
    div{
        position:relative;
        height:100%;

        img{
            height:100%;
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

    .large-c2c-image{
        img{
            max-height: 100%;
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

        svg{
            position:absolute;
            color:#CCC;
            font-size:40px;
            left:130px;
            top:80px;
        }
    }

    .large-c2c-image.is-loading{
        background: #EEE;
        width:100%;
    }

</style>
