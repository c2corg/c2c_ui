<template>
    <div v-if="documents" class="cards-container is-flex">
        <div
            v-for="document in documents.documents"
            :key="document.document_id"
            class="card-image">
            <img :src="getSmallImageUrl(document)" height="250" @click="go(document)">
        </div>
    </div>
</template>

<script>
    import imageUrls from '@/js/image-urls'

    export default {
        props: {
            documents: {
                type: Object,
                required: true
            }
        },

        methods: {
            go(document) {
                this.$router.push({
                    name: 'image',
                    params: { id: document.document_id }
                })
            },

            getSmallImageUrl: imageUrls.getSmall
        }
    }

</script>

<style scoped lang="scss">

    .cards-container{
        flex-flow:wrap row;
        //margin:auto;

        .card-image{
            transition:0.2s;
            margin-bottom:5px;
            flex-grow: 1;

            img{
                cursor:pointer;
                height:200px;
            }
        }
    }

</style>
