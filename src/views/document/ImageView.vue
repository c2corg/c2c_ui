<template>
    <view-container v-if="document" :document="document" :lang="lang" :version="version" :error="promise.error">
        <div class="columns">

            <div class="column is-3">
                <content-box>
                    <label-value v-if="document.activities.length" :label="$gettext('activities')">
                        <activities :activities="document.activities"/>
                    </label-value>

                    <label-value v-if="document.areas.length">
                        <areas-links :areas="document.areas"/>
                    </label-value>

                    <label-value v-if="document.author" :label="$gettext('author')">
                        <author-link :author="document.author"/>
                    </label-value>

                    <label-value :label="$gettext('creator')">
                        <author-link :author="document.creator"/>
                    </label-value>

                    <label-value v-if="document.categories.length" :label="$gettext('categories')">
                        {{ document.categories.join(", ") }}
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

                <tool-box :document="document" />
            </div>

            <div class="column">
                <content-box class="is-paddingless">
                    <img :src="getImageUrl(document)">
                </content-box>

                <markdown-section
                    :document="document"

                    :field="fields.summary"/>

                <markdown-section
                    :document="document"

                    :field="fields.description"
                    hide-title/>

                <comments-box :document="document" />

            </div>

        </div>
    </view-container>
</template>

<script>
    import imageUrls from '@/js/imageUrls'

    import DocumentViewMixin from "./utils/DocumentViewMixin.js"

    export default {
        mixins : [ DocumentViewMixin ],

        methods:{
            getImageUrl:imageUrls.get,
        }
    }
</script>
