<template>
    <edition-container
        v-if="document"
        :document="document"
        :locale="locale">
        <tab-view>
            <tab-item :title="$gettext('general information')">
                <field-simple :document="document" :base="locale" :field="fields.title"/>
                <field-simple :document="document" :field="fields.image_type"  />
                <field-simple :document="document" :field="fields.activities"  />
                <field-simple :document="document" :field="fields.categories" />

                <!--<field-simple :document="document" :field="fields.author" />-->

                <field-simple :document="document" :field="fields.date_time" />
                <field-simple :document="document" :field="fields.filename" />
                <field-simple :document="document" :field="fields.file_size" />
                <field-simple :document="document" :field="fields.height" />
                <field-simple :document="document" :field="fields.width" />
            </tab-item>

            <tab-item :title="$gettext('geolocation')">
                <field-simple :document="document" :field="fields.elevation" />
            </tab-item>

            <tab-item :title="$gettext('camera settings')">
                <field-simple :document="document" :field="fields.camera_name" />
                <field-simple :document="document" :field="fields.fnumber" />
                <field-simple :document="document" :field="fields.focal_length" />
                <field-simple :document="document" :field="fields.exposure_time" />
                <field-simple :document="document" :field="fields.iso_speed" />
            </tab-item>

            <tab-item :title="$gettext('general information')">
                <field-simple :document="document" :base="locale" :field="fields.summary"/>
                <field-simple :document="document" :base="locale" :field="fields.description"/>
            </tab-item>

        </tab-view>
    </edition-container>
</template>

<script>

    import mixins from './utils/mixins.js'

    export default {
        mixins : [
            mixins,
        ],
    }
</script>
