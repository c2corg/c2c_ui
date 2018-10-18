<template>
    <edition-container>
        <template slot-scope="{ document, fields }">
            <tab-view>
                <tab-item :title="$gettext('general information')">
                    <form-input-row :document="document" :field="fields.title"/>
                    <form-input-row :document="document" :field="fields.image_type" />
                    <form-input-row :document="document" :field="fields.activities" />
                    <form-input-row :document="document" :field="fields.categories" />

                    <!--<form-input-row :document="document" :field="fields.author" />-->

                    <form-input-row :document="document" :field="fields.date_time" />
                    <form-input-row :document="document" :field="fields.filename" />
                    <form-input-row :document="document" :field="fields.file_size" />
                    <form-input-row :document="document" :field="fields.height" />
                    <form-input-row :document="document" :field="fields.width" />
                </tab-item>

                <tab-item :title="$gettext('geolocation')">
                    <form-input-row :document="document" :field="fields.elevation" />
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

            </tab-view>
        </template>
    </edition-container>
</template>

<script>

    import FormComponentsMixin from './utils/FormComponentsMixin'

    export default {
        mixins: [ FormComponentsMixin ],
    }

</script>
