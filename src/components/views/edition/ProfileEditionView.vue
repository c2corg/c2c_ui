<template>
    <edition-container>
        <template slot-scope="{ document, fields }">

            <form-input-row :document="document" :field="fields.activities" />
            <form-input-row :document="document" :field="fields.categories" />

            <form-input-row :document="document" :field="fields.summary"/>
            <form-input-row :document="document" :field="fields.description"/>
        </template>
    </edition-container>
</template>

<script>

    import DocumentEditionViewMixin from './utils/DocumentEditionViewMixin'

    export default {
        mixins: [ DocumentEditionViewMixin ],
    }

</script>
