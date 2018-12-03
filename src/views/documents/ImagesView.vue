<template>
    <div class="section images-view">
        <h1 class="title is-1">
            {{ title }}
        </h1>

        <div>
            <query-items />
        </div>

        <loading-notification :promise="promise"/>

        <div class="columns">
            <div class="column">
                <div v-if="documents" class="cards-container is-flex">
                    <div v-for="document in documents.documents"
                         :key="document.document_id" class="card-image">
                        <img :src="getSmallImageUrl(document)" height="250" @click="go(document)">
                    </div>
                </div>
            </div>
        </div>

        <page-selector v-if="documents!=null" :documents="documents"/>

    </div>
</template>

<script>

    import imageUrls from '@/js/image-urls'
    import c2c from '@/js/apis/c2c'

    import QueryItems from './utils/QueryItems'
    import PageSelector from './utils/PageSelector'

    export default {
        components: {
            QueryItems,
            PageSelector,
        },


        data() {
            return {
                promise: null,
            }
        },

        computed:{
            documents(){
                return this.promise.data
            },
            title(){
                return this.$route.name
            },
            documentType(){
                return this.$route.name.slice(0, -1)
            },
        },

        watch: {
            "$route": {
                handler: "load",
                immediate: true,
            }
        },

        methods:{
            load(){
                this.promise = c2c[this.documentType].getAll(this.$route.query)
            },

            go(image){
                this.$router.push({
                    name: "image",
                    params: { id: image.document_id }
                })
            },

            getSmallImageUrl:imageUrls.getSmall,
        },
    }

</script>

<style scoped>

.images-view .cards-container{
    flex-flow:wrap row;
    //margin:auto;
}

.images-view .card-image{
    transition:0.2s;
    margin:5px;
    cursor:pointer;
    flex-grow: 1;
}

.images-view .card-image img{
    height:200px;
}

</style>
