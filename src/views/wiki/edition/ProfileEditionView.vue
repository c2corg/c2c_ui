<template>
    <edition-container
        :mode="mode"
        :is-loading="!!promise.loading"
        :document="document"
        :generic-errors="genericErrors"
        @save="save">

        <form-input-row :document="document" :field="fields.activities" />
        <form-input-row :document="document" :field="fields.categories" />

        <form-input-row :document="document" :field="fields.summary"/>
        <form-input-row :document="document" :field="fields.description"/>

        <form-row :label="$gettext('Terrain')" is-grouped always-visible>
            <input-simple type="number" :prefix="$gettext('Longitude')" postfix="°E" v-model="longitude" @input="setGeometryPoint"/>
            <input-simple type="number" :prefix="$gettext('Latitude')" postfix="°N" v-model="latitude" @input="setGeometryPoint"/>
        </form-row>

        <map-input-row :document="document" />

    </edition-container>
</template>

<script>

    import DocumentEditionViewMixin from './utils/DocumentEditionViewMixin'

    export default {
        mixins: [ DocumentEditionViewMixin ]
    }

</script>
