<template>
    <edition-container :mode="mode" :document="document" :generic-errors="genericErrors">
        <div class="columns is-multiline">
            <form-field class="is-12" :document="document" :field="fields.activities" />
            <form-field class="is-12" :document="document" :field="fields.categories" />
            <form-field class="is-12" :document="document" :field="fields.summary"/>
            <form-field class="is-12" :document="document" :field="fields.description"/>
        </div>

        <map-input-row :document="document" />
        <save-document-row @save="save" :is-loading="!!promise.loading" />

    </edition-container>
</template>

<script>

    import DocumentEditionViewMixin from './utils/DocumentEditionViewMixin'

    export default {

        mixins: [ DocumentEditionViewMixin ]
    }

</script>
