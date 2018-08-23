<template>
    <div class="columns">

        <div  class="column is-9">
            <img :src="getImageUrl(document)"/>

            <summary>
                <markdown :content="locale.summary"></markdown>
            </summary>
            <markdown :content="locale.description"></markdown>

        </div>

        <div class="column is-3">
            <information-item>
                <activities :activities="document.activities"/>
            </information-item>

            <information-item>
                <areas-links :areas="document.areas"/>
            </information-item>

            <information-item label="author" v-if="document.author">
                <author-link :author="document.author"/>
            </information-item>

            <information-item label="creator">
                <author-link :author="document.creator"/>
            </information-item>

            <information-item label="categories"  v-if="document.categories.length">
                {{document.categories}}
            </information-item>

            <simple-information-item label="camera name" :content="document.camera_name"/>
            <simple-information-item label="exposure time" :content="document.exposure_time"/>
            <simple-information-item label="fnumber" :content="document.fnumber"/>
            <simple-information-item label="focale length" :content="document.focale_length"/>
            <simple-information-item label="iso speed" :content="document.iso_speed"/>


            <simple-information-item label="file name" :content="document.filename"/>
            <simple-information-item label="file size" :content="document.file_size"/>
            <simple-information-item label="height" :content="document.height"/>
            <simple-information-item label="width" :content="document.width"/>

            <distance-information-item label="elevation" :content="document.elevation"/>


        </div>
    </div>

</template>

<script>
    import Markdown from './utils/Markdown'
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
            DocumentLicense,
            Activities,
            InformationItem,
            SimpleInformationItem,
            DistanceInformationItem,
        },

        props:["document", "locale"],

        methods:{
            getImageUrl : c2c.getImageUrl,
        }

    }
</script>
