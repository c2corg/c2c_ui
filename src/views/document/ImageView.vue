<template>
    <div class="section">
        <document-view-header :document="document" :version="version" :promise="promise" />
        <div v-if="document" class="columns">
            <div class="column is-3">
                <div class="box">
                    <label-value v-if="document.activities.length" :label="$gettext('activities')">
                        <activities :activities="document.activities"/>
                    </label-value>

                    <label-value v-if="document.areas.length">
                        <areas-links :areas="document.areas"/>
                    </label-value>

                    <label-value v-if="document.author" :label="$gettext('author')">
                        <author-link :author="document.author"/>
                    </label-value>

                    <label-value v-if="document.creator" :label="$gettext('creator')">
                        <author-link :author="document.creator"/>
                    </label-value>

                    <field-view :document="document" :field="fields.image_type" />
                    <field-view :document="document" :field="fields.quality" />

                    <label-value v-if="document.categories && document.categories.length" :label="$gettext('categories')">
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
                </div>

                <tool-box :document="document" />
            </div>

            <div class="column is-9">
                <div class="box is-paddingless">
                    <a :href="getImageUrl(document)">
                        <img class="main-image" :src="getImageUrl(document)">
                    </a>
                </div>

                <markdown-section :document="document" :field="fields.summary"/>
                <markdown-section :document="document" :field="fields.description" hide-title/>

                <routes-box :document="document" hide-buttons/>
                <recent-outings-box :document="document" hide-see-all-results-button />
                <comments-box :document="document" />

            </div>

        </div>
    </div>
</template>

<script>
    import imageUrls from '@/js/image-urls'

    import DocumentViewMixin from './utils/DocumentViewMixin.js'

    export default {
        mixins: [ DocumentViewMixin ],

        methods: {
            getImageUrl: imageUrls.get
        }
    }
</script>

<style scoped lang="scss">
    .main-image{
        // remove the ugly 4px in the bottom
        display:block;
    }
</style>
