<template>
    <edition-container
        :mode="mode"
        :document="document"
        :generic-errors="genericErrors"
        :is-loading="saving"
        @save="save">
        <div class="columns is-multiline">
            <form-field class="is-12" :document="document" :field="fields.activities" />
            <form-field class="is-12" :document="document" :field="fields.categories" />
            <form-field class="is-12" :document="document" :field="fields.summary"/>
            <form-field class="is-12" :document="document" :field="fields.description"/>
        </div>

        <map-input-row :document="document" />

        <hr>

    </edition-container>
</template>

<script>

    import DocumentEditionViewMixin from './utils/DocumentEditionViewMixin'

    export default {

        mixins: [ DocumentEditionViewMixin ]
    }

</script>
