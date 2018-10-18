<template>
    <edition-container>
        <template slot-scope="{ document, fields }">
            <form-input-row :document="document" :field="fields.title" is-expanded/>
            <form-input-row :document="document" :field="fields.article_type" />
            <form-input-row :document="document" :field="fields.activities"/>
            <form-input-row :document="document" :field="fields.categories" />
            <form-input-row :document="document" :field="fields.summary"/>
            <form-input-row :document="document" :field="fields.description"/>
        </template>
    </edition-container>
</template>

<script>

    import FormComponentsMixin from './utils/FormComponentsMixin'

    export default {
        mixins: [ FormComponentsMixin ],
    }

</script>
