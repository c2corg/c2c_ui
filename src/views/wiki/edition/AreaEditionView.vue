<template>
    <edition-container
        :mode="mode"
        :is-loading="!!promise.loading"
        :document="document"
        :generic-errors="genericErrors"
        @save="save">
        <form-input-row :document="document" :field="fields.title"/>
        <form-input-row :document="document" :field="fields.area_type"/>
        <form-input-row :document="document" :field="fields.summary"/>
        <form-input-row :document="document" :field="fields.description"/>
    </edition-container>
</template>

<script>

    import DocumentEditionViewMixin from './utils/DocumentEditionViewMixin.js'

    export default {
        mixins : [ DocumentEditionViewMixin, ],
    }
</script>
