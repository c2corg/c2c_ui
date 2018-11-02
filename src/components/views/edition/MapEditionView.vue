<template>
    <edition-container
        :mode="mode"
        :is-loading="!!promise.loading"
        :document="document"
        :generic-errors="genericErrors"
        @save="save">
        <form-input-row :document="document" :field="fields.title"/>
        <form-input-row :document="document" :field="fields.editor" />
        <form-input-row :document="document" :field="fields.scale" />
        <form-input-row :document="document" :field="fields.code" />
    </edition-container>
</template>

<script>

    import DocumentEditionViewMixin from './utils/DocumentEditionViewMixin'

    export default {
        mixins: [ DocumentEditionViewMixin ],
    }

</script>
