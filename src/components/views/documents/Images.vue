<template>
    <div class="section images-view">
        <h1 class="title is-1">
            {{ title }}
        </h1>

        <div>
            <query-items />
        </div>

        <loading-notification :loaded="documents!=null" class="column"/>

        <div class="columns">
            <div class="column">
                <div v-if="documents" class="cards-container is-flex">
                    <div v-for="document in documents.documents"
                         :key="document.document_id" class="card-image">
                        <img :src="c2c.getSmallImageUrl(document)" height="250" @click="go(document)">
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>

    import c2c from '@/js/c2c.js'

    import QueryItems from './QueryItems'

    export default {
        components: {
            QueryItems,
        },


        data() {
            return {
                documents: null,
                title: this.$route.name,

                c2c : c2c,

                go(image){
                    this.$router.push({
                        name: "image",
                        params: { id: image.document_id }
                    })
                }
            }
        },

        created() {
            c2c[this.$route.name].get().then(response => {
                this.documents=response.data;
            });
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
