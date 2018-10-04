<template>
    <document-view-container
        v-if="document"
        :document="document"
        :locale="locale"

        :version="version"
        :previous-version-id="previousVersionId"
        :next-version-id="nextVersionId">
        <div class="columns">

            <div class="column is-3">
                <content-box>
                    <label-value v-if="document.activities.length" label="activities">
                        <activities :activities="document.activities"/>
                    </label-value>

                    <label-value v-if="document.areas.length">
                        <areas-links :areas="document.areas"/>
                    </label-value>

                    <label-value v-if="document.author" label="author">
                        <author-link :author="document.author"/>
                    </label-value>

                    <label-value label="creator">
                        <author-link :author="document.creator"/>
                    </label-value>

                    <label-value v-if="document.categories.length" label="categories">
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
            </div>

            <div class="column">
                <content-box class="is-paddingless">
                    <img :src="getImageUrl(document)">
                </content-box>

                <markdown-section
                    :document="document"
                    :locale="locale"
                    :field="fields.summary"/>

                <markdown-section
                    :document="document"
                    :locale="locale"
                    :field="fields.description"
                    hide-title/>

                <comments-box :document="document" :locale="locale" />

            </div>

        </div>
    </document-view-container>
</template>

<script>
    import mixins from "./utils/mixins.js"
    import c2c from '@/js/c2c'

    export default {
        mixins : [
            mixins,
        ],

        methods:{
            getImageUrl:c2c.getImageUrl,
        }
    }
</script>
