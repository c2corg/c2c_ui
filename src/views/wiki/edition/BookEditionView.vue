<template>
    <edition-container
        :mode="mode"
        :is-loading="!!promise.loading"
        :document="document"
        :generic-errors="genericErrors"
        @save="save">

        <tab-view>
            <tab-item :title="$gettext('general informations')">
                <form-input-row :document="document" :field="fields.title" is-expanded/>
                <form-input-row :document="document" :field="fields.activities"/>
                <form-input-row :document="document" :field="fields.book_types" />
                <form-input-row :document="document" :field="fields.author" />
                <form-input-row :document="document" :field="fields.editor" />
                <form-input-row :document="document" :field="fields.langs" />
                <form-input-row :document="document" :field="fields.publication_date" />
                <form-input-row :document="document" :field="fields.nb_pages" />
                <form-input-row :document="document" :field="fields.isbn" />
                <form-input-row :document="document" :field="fields.url" is-expanded />

                <quality-input-row :document="document" />
            </tab-item>

            <tab-item :title="$gettext('description')">
                <form-input-row :document="document" :field="fields.summary"/>
                <form-input-row :document="document" :field="fields.description"/>
            </tab-item>

            <tab-item :title="$gettext('associations')">
                <associations-input-row :document="document" :field="fields.articles" />
                <associations-input-row :document="document" :field="fields.waypoints" />
                <associations-input-row :document="document" :field="fields.routes" />
            </tab-item>

        </tab-view>
    </edition-container>
</template>

<script>

    import DocumentEditionViewMixin from './utils/DocumentEditionViewMixin'

    export default {
        mixins: [ DocumentEditionViewMixin ]
    }

</script>
