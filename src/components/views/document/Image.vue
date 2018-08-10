<template>
    <div v-if="image" class="section content">
        <h1>
            <i class="fas fa-camera"></i>
            <document-title :document="image"/>
        </h1>

        <div class="columns">

            <div  class="column is-9">
                <img :src="getImageUrl(image)"/>

                <summary>
                    <markdown :content="image.locales[0].summary"></markdown>
                </summary>
                <markdown :content="image.locales[0].description"></markdown>

            </div>

            <div class="column is-3">
                <information-item>
                    <activities :activities="image.activities"/>
                </information-item>

                <information-item>
                    <areas-links :areas="image.areas"/>
                </information-item>

                <information-item label="author" v-if="image.author">
                    <author-link :author="image.author"/>
                </information-item>

                <information-item label="creator">
                    <author-link :author="image.creator"/>
                </information-item>

                <information-item label="categories"  v-if="image.categories.length">
                    {{image.categories}}
                </information-item>

                <simple-information-item label="camera name" :content="image.camera_name"/>
                <simple-information-item label="exposure time" :content="image.exposure_time"/>
                <simple-information-item label="fnumber" :content="image.fnumber"/>
                <simple-information-item label="focale length" :content="image.focale_length"/>
                <simple-information-item label="iso speed" :content="image.iso_speed"/>


                <simple-information-item label="file name" :content="image.filename"/>
                <simple-information-item label="file size" :content="image.file_size"/>
                <simple-information-item label="height" :content="image.height"/>
                <simple-information-item label="width" :content="image.width"/>

                <distance-information-item label="elevation" :content="image.elevation"/>


            </div>
        </div>
    </div>

</template>

<script>
    import Markdown from '@/components/Markdown'
    import DocumentTitle from '@/components/utils/DocumentTitle'
    import DocumentLicense from '@/components/utils/DocumentLicense'
    import Activities from '@/components/utils/Activities'

    import InformationItem from '@/components/views/document/utils/InformationItem'
    import SimpleInformationItem from '@/components/views/document/utils/SimpleInformationItem'
    import DistanceInformationItem from '@/components/views/document/utils/DistanceInformationItem'
    import AreasLinks from '@/components/views/document/utils/AreasLinks'
    import AuthorLink from '@/components/views/document/utils/AuthorLink'

    import c2c from '@/js/c2c.js'

    export default {

        components: {
            AreasLinks,
            AuthorLink,
            Markdown,
            DocumentTitle,
            DocumentLicense,
            Activities,
            InformationItem,
            SimpleInformationItem,
            DistanceInformationItem,
        },

        data() {
            return {
                image: null,
                getImageUrl : c2c.getImageUrl,
            }
        },

        created() {
            c2c.image.get(this.$route.params.id).then(response => {this.image=response.data});
        }

    }
</script>
