<template>
    <edition-container
        :mode="mode"
        :is-loading="!!promise.loading"
        :document="document"
        :generic-errors="genericErrors"
        @save="save">
        <tab-view>
            <tab-item :title="$gettext('general information')">
                <form-input-row :document="document" :field="fields.title" is-expanded/>
                <form-input-row :document="document" :field="fields.image_type" />
                <form-input-row :document="document" :field="fields.activities" />
                <form-input-row :document="document" :field="fields.categories" />

                <!--<form-input-row :document="document" :field="fields.author" />-->

                <form-input-row :document="document" :field="fields.date_time" />

                <form-row :label="$gettext('File')" is-grouped>
                    <form-input :document="document" :field="fields.filename" :prefix="$gettext('name')"/>
                    <form-input :document="document" :field="fields.file_size" :prefix="$gettext('file_size')"/>
                </form-row>

                <form-row is-grouped>
                    <form-input :document="document" :field="fields.height" :prefix="$gettext('height')"/>
                    <form-input :document="document" :field="fields.width" :prefix="$gettext('width')"/>
                </form-row>

                <quality-input-row :document="document" />

            </tab-item>

            <tab-item :title="$gettext('geolocation')">

                <form-row :label="$gettext('Terrain')" is-grouped>
                    <form-input :document="document" :field="fields.elevation" :prefix="$gettext('elevation')"/>
                    <input-simple type="number" :prefix="$gettext('Longitude')" postfix="°E" v-model="longitude" @input="setGeometryPoint"/>
                    <input-simple type="number" :prefix="$gettext('Latitude')" postfix="°N" v-model="latitude" @input="setGeometryPoint"/>
                </form-row>

                <map-input-row :document="document" />
            </tab-item>

            <tab-item :title="$gettext('camera settings')">
                <form-input-row :document="document" :field="fields.camera_name" />
                <form-input-row :document="document" :field="fields.fnumber" />
                <form-input-row :document="document" :field="fields.focal_length" />
                <form-input-row :document="document" :field="fields.exposure_time" />
                <form-input-row :document="document" :field="fields.iso_speed" />
            </tab-item>

            <tab-item :title="$gettext('general information')">
                <form-input-row :document="document" :field="fields.summary"/>
                <form-input-row :document="document" :field="fields.description"/>
            </tab-item>

            <tab-item :title="$gettext('associations')">
                <associations-input-row :document="document" :field="fields.articles" />
                <associations-input-row :document="document" :field="fields.waypoints" />
                <associations-input-row :document="document" :field="fields.routes" />
                <associations-input-row :document="document" :field="fields.books" />
            </tab-item>

        </tab-view>
    </edition-container>
</template>

<script>

    import DocumentEditionViewMixin from './utils/DocumentEditionViewMixin'

    export default {
        mixins: [ DocumentEditionViewMixin ]
    }

</script>
