<template>
    <edition-container>
        <template slot-scope="{ document, fields }">

            <tab-view>
                <tab-item :title="$gettext('general informations')">

                    <form-input-row :document="document" :field="fields.title"/>
                    <form-input-row :document="document" :field="fields.activities"/>
                    <form-input-row :document="document" :field="fields.book_types" />
                    <form-input-row :document="document" :field="fields.author" />
                    <form-input-row :document="document" :field="fields.editor" />
                    <form-input-row :document="document" :field="fields.langs" />
                    <form-input-row :document="document" :field="fields.publication_date" />
                    <form-input-row :document="document" :field="fields.nb_pages" />
                    <form-input-row :document="document" :field="fields.isbn" />
                    <form-input-row :document="document" :field="fields.url" class="is-8" />

                </tab-item>

                <tab-item :title="$gettext('description')">
                    <form-input-row :document="document" :field="fields.summary"/>
                    <form-input-row :document="document" :field="fields.description"/>
                </tab-item>

            </tab-view>
        </template>
    </edition-container>
</template>

<script>

    import FormComponentsMixin from './utils/FormComponentsMixin'

    export default {
        mixins: [ FormComponentsMixin ],
    }

</script>
