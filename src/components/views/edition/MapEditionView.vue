<template>
    <edition-container>
        <template slot-scope="{ document, fields }">
            <form-input-row :document="document" :field="fields.title"/>
            <form-input-row :document="document" :field="fields.editor" />
            <form-input-row :document="document" :field="fields.scale" />
            <form-input-row :document="document" :field="fields.code" />
        </template>
    </edition-container>
</template>

<script>

    import FormComponentsMixin from './utils/FormComponentsMixin'

    export default {
        mixins: [ FormComponentsMixin ],
    }

</script>
