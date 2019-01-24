<template>
    <edition-container
        :mode="mode"
        :is-loading="!!promise.loading"
        :document="document"
        :generic-errors="genericErrors"
        @save="save">
        <form-input-row :document="document" :field="fields.title"/>
        <form-input-row :document="document" :field="fields.area_type"/>
        <map-input-row v-if="$user.isModerator" :document="document" geom-detail-editable/>
        <form-input-row :document="document" :field="fields.summary"/>
        <form-input-row :document="document" :field="fields.description"/>
        <quality-input-row :document="document" />
    </edition-container>
</template>

<script>

    import DocumentEditionViewMixin from './utils/DocumentEditionViewMixin.js'

    export default {
        mixins: [ DocumentEditionViewMixin ],

        methods: {
            beforeSave() {
                if (!this.$user.isModerator) {
                    // need to delete geomtry : API won't allow any modification otherwise
                    delete this.document.geometry
                }
            }
        }
    }
</script>
