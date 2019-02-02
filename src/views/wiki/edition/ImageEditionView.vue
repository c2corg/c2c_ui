<template>
    <edition-container
        :mode="mode"
        :document="document"
        :generic-errors="genericErrors">
        <form-section
            :title="$gettext('general informations')"
            :sub-title="$gettext('Title, activity and characteristics of the picture')"
            expanded
            @save="save"
            :is-loading="!!promise.loading">
            <div class="columns is-multiline">
                <form-field :document="document" :field="fields.title"/>
                <form-field class="is-narrow" :document="document" :field="fields.image_type" />
                <form-field class="is-12" :document="document" :field="fields.activities" />
                <form-field class="is-12" :document="document" :field="fields.categories" />

                <!--<form-field :document="document" :field="fields.author" />-->
                <!-- <form-field :document="document" :field="fields.date_time" /> -->

                <form-field class="is-6" :document="document" :field="fields.filename"/>
                <form-field class="is-6" :document="document" :field="fields.file_size"/>
                <form-field class="is-6" :document="document" :field="fields.height"/>
                <form-field class="is-6" :document="document" :field="fields.width"/>
            </div>

            <quality-input-row :document="document" />

        </form-section>

        <form-section
            :title="$gettext('geolocation')"
            :sub-title="$gettext('Precise localisation of the shooting')"
            @save="save"
            :is-loading="!!promise.loading">

            <div class="columns is-multiline">
                <form-field class="is-6" :document="document" :field="fields.elevation"/>
            </div>

            <map-input-row :document="document" />
        </form-section>

        <form-section
            :title="$gettext('camera settings')"
            :sub-title="$gettext('Parameters of the Digital Camera')"
            @save="save"
            :is-loading="!!promise.loading">
            <div class="columns is-multiline">
                <form-field class="is-4" :document="document" :field="fields.camera_name" />
                <form-field class="is-4" :document="document" :field="fields.fnumber" />
                <form-field class="is-4" :document="document" :field="fields.focal_length" />
                <form-field class="is-4" :document="document" :field="fields.exposure_time" />
                <form-field class="is-4" :document="document" :field="fields.iso_speed" />
            </div>
        </form-section>

        <form-section
            :title="$gettext('Detailed information')"
            :sub-title="$gettext('Open fields to detail the picture\'s context')"
            @save="save"
            :is-loading="!!promise.loading">
            <div class="columns is-multiline">
                <form-field class="is-12" :document="document" :field="fields.summary"/>
                <form-field class="is-12" :document="document" :field="fields.description"/>
            </div>
        </form-section>

        <form-section
            :title="$gettext('associations')"
            :sub-title="$gettext('Articles, waypoints, routes or books to be linked.')"
            @save="save"
            :is-loading="!!promise.loading">
            <associations-input-row :document="document" :field="fields.articles" />
            <associations-input-row :document="document" :field="fields.waypoints" />
            <associations-input-row :document="document" :field="fields.routes" />
            <associations-input-row :document="document" :field="fields.books" />
        </form-section>

    </edition-container>
</template>

<script>

    import DocumentEditionViewMixin from './utils/DocumentEditionViewMixin'

    export default {
        mixins: [ DocumentEditionViewMixin ]
    }
</script>
