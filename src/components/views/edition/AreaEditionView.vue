<template>
    <edition-container>
        <template slot-scope="{ document, fields }">
            <form-input-row :document="document" :field="fields.title"/>
            <form-input-row :document="document" :field="fields.area_type"/>
            <form-input-row :document="document" :field="fields.summary"/>
            <form-input-row :document="document" :field="fields.description"/>
        </template>
    </edition-container>
</template>

<script>

    import FormComponentsMixin from './utils/FormComponentsMixin.js'

    export default {
        mixins : [ FormComponentsMixin, ],
    }
</script>
