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

    </edition-container>
</template>

<script>

    import DocumentEditionViewMixin from './utils/DocumentEditionViewMixin'

    export default {
        mixins: [ DocumentEditionViewMixin ]
    }

</script>
