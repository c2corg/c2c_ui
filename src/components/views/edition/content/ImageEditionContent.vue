<template>
    <div>
        <edit-section :document="document" header="general information">
            <input-base class="is-9" :document="document" :base="locale" :field="fields.title"/>
            <input-base class="is-3" :document="document" :field="fields.image_type" />
            <input-activities class="is-6" :document="document"/>
            <input-checkboxes class="is-6" :document="document" :field="fields.categories" />

            <!--<input-base :document="document" :field="fields.author" />-->

            <input-base :document="document" :field="fields.date_time" />
            <input-base :document="document" :field="fields.filename" />
            <input-base class="is-2" :document="document" :field="fields.file_size" />
            <input-base class="is-2" :document="document" :field="fields.height" />
            <input-base class="is-2" :document="document" :field="fields.width" />
        </edit-section>

        <edit-section :document="document" header="geolocation">
            <input-base :document="document" :field="fields.elevation" />
        </edit-section>

        <edit-section :document="document" header="camera settings">
            <input-base :document="document" :field="fields.camera_name" />
            <input-base :document="document" :field="fields.fnumber" />
            <input-base :document="document" :field="fields.focal_length" />
            <input-base :document="document" :field="fields.exposure_time" />
            <input-base :document="document" :field="fields.iso_speed" />
        </edit-section>

        <edit-section :document="document" header="general information">
            <input-base class="is-12" :document="document" :base="locale" :field="fields.summary"/>
            <input-base class="is-12" :document="document" :base="locale" :field="fields.description"/>
        </edit-section>

    </div>
</template>

<script>
    import InputBase from './utils/InputBase'
    import InputActivities from './utils/InputActivities'
    import InputCheckboxes from './utils/InputCheckboxes'
    import EditSection from './utils/EditSection'

    export default {
        components:{
            InputBase,
            InputActivities,
            InputCheckboxes,
            EditSection,
        },

        props : ["document", "locale", "fields"],
    }
</script>
