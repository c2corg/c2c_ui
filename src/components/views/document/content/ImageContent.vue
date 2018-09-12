<template>
    <div class="columns">

        <div class="column is-3">
            <content-box>
                <label-value label="activities" v-if="document.activities.length">
                    <activities :activities="document.activities"/>
                </label-value>

                <label-value v-if="document.areas.length">
                    <areas-links :areas="document.areas"/>
                </label-value>

                <label-value label="author" v-if="document.author">
                    <author-link :author="document.author"/>
                </label-value>

                <label-value label="creator">
                    <author-link :author="document.creator"/>
                </label-value>

                <label-value label="categories"  v-if="document.categories.length">
                    {{document.categories.join(", ")}}
                </label-value>

                <field-view :document="document" :field="fields.camera_name"/>
                <field-view :document="document" :field="fields.exposure_time"/>
                <field-view :document="document" :field="fields.fnumber"/>
                <field-view :document="document" :field="fields.focal_length"/>
                <field-view :document="document" :field="fields.iso_speed"/>
                <field-view :document="document" :field="fields.filename"/>
                <field-view :document="document" :field="fields.file_size"/>
                <field-view :document="document" :field="fields.height"/>
                <field-view :document="document" :field="fields.width"/>
                <field-view :document="document" :field="fields.elevation"/>
            </content-box>
        </div>

        <div  class="column">
            <content-box class="is-paddingless">
                <img :src="getImageUrl(document)"/>
            </content-box>

            <summary>
                <markdown :content="locale.summary"></markdown>
            </summary>
            <markdown :content="locale.description"></markdown>

            <comments-box :document="document" :locale="locale" />

        </div>

    </div>

</template>

<script>
    import c2c from '@/js/c2c.js'

    import Markdown from './utils/Markdown'
    import LabelValue from './utils/LabelValue'
    import FieldView from './utils/FieldView'
    import AreasLinks from './utils/AreasLinks'

    import CommentsBox from './utils/CommentsBox'

    export default {

        components: {
            AreasLinks,
            Markdown,
            LabelValue,
            FieldView,
            CommentsBox,
        },

        props:["document", "locale", "fields"],

        methods:{
            getImageUrl : c2c.getImageUrl,
        }

    }
</script>
