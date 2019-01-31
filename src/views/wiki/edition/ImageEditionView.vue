<template>
    <edition-container-beta
        :mode="mode"
        :document="document"
        :generic-errors="genericErrors">
        <form-section :title="$gettext('general informations')" expanded @save="save" :is-loading="!!promise.loading" :enable-comment="mode == 'edit'">
            <div class="columns is-multiline">
                <form-field :document="document" :field="fields.title"/>
                <form-field class="is-narrow" :document="document" :field="fields.image_type" />
                <form-field class="is-12" :document="document" :field="fields.activities" />
                <form-field class="is-12" :document="document" :field="fields.categories" />

                <!--<form-input-row :document="document" :field="fields.author" />-->
                <!-- <form-input-row :document="document" :field="fields.date_time" /> -->

                <form-field class="is-6" :document="document" :field="fields.filename"/>
                <form-field class="is-6" :document="document" :field="fields.file_size"/>
                <form-field class="is-6" :document="document" :field="fields.height"/>
                <form-field class="is-6" :document="document" :field="fields.width"/>
            </div>

            <quality-input-row-beta :document="document" />

        </form-section>

        <form-section :title="$gettext('geolocation')" @save="save" :is-loading="!!promise.loading" :enable-comment="mode == 'edit'">

            <div class="columns is-multiline">
                <form-field class="is-6" :document="document" :field="fields.elevation"/>
            </div>

            <map-input-row-beta :document="document" />
        </form-section>

        <form-section :title="$gettext('camera settings')" @save="save" :is-loading="!!promise.loading" :enable-comment="mode == 'edit'">
            <div class="columns is-multiline">
                <form-field class="is-4" :document="document" :field="fields.camera_name" />
                <form-field class="is-4" :document="document" :field="fields.fnumber" />
                <form-field class="is-4" :document="document" :field="fields.focal_length" />
                <form-field class="is-4" :document="document" :field="fields.exposure_time" />
                <form-field class="is-4" :document="document" :field="fields.iso_speed" />
            </div>
        </form-section>

        <form-section :title="$gettext('general informations')" @save="save" :is-loading="!!promise.loading" :enable-comment="mode == 'edit'">
            <div class="columns is-multiline">
                <form-field class="is-12" :document="document" :field="fields.summary"/>
                <form-field class="is-12" :document="document" :field="fields.description"/>
            </div>
        </form-section>

        <form-section :title="$gettext('associations')" @save="save" :is-loading="!!promise.loading" :enable-comment="mode == 'edit'">
            <associations-input-row-beta :document="document" :field="fields.articles" />
            <associations-input-row-beta :document="document" :field="fields.waypoints" />
            <associations-input-row-beta :document="document" :field="fields.routes" />
            <associations-input-row-beta :document="document" :field="fields.books" />
        </form-section>

    </edition-container-beta>
</template>

<script>

    import DocumentEditionViewMixin from './utils/DocumentEditionViewMixin'

    export default {
        mixins: [ DocumentEditionViewMixin ]
    }
</script>
