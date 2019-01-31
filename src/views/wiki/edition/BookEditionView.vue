<template>
    <edition-container-beta
        :mode="mode"
        :document="document"
        :generic-errors="genericErrors">

        <form-section :title="$gettext('general informations')" expanded @save="save" :is-loading="!!promise.loading" :enable-comment="mode == 'edit'">
            <div class="columns is-multiline">
                <form-field class="is-12" :document="document" :field="fields.title"/>
                <form-field class="is-12" :document="document" :field="fields.activities"/>
                <form-field class="is-12" :document="document" :field="fields.book_types" />
                <form-field class="is-12" :document="document" :field="fields.langs" />
                <form-field class="is-4" :document="document" :field="fields.author" />
                <form-field class="is-4" :document="document" :field="fields.editor" />
                <form-field class="is-4" :document="document" :field="fields.publication_date" />
                <form-field class="is-4" :document="document" :field="fields.nb_pages" />
                <form-field class="is-4" :document="document" :field="fields.isbn" />
                <form-field class="is-4" :document="document" :field="fields.url" />
            </div>

            <quality-input-row-beta :document="document" />

        </form-section>

        <form-section :title="$gettext('description')" @save="save" :is-loading="!!promise.loading" :enable-comment="mode == 'edit'">
            <div class="columns is-multiline">
                <form-field class="is-12" :document="document" :field="fields.summary"/>
                <form-field class="is-12" :document="document" :field="fields.description"/>
            </div>
        </form-section>

        <form-section :title="$gettext('associations')" @save="save" :is-loading="!!promise.loading" :enable-comment="mode == 'edit'">
            <associations-input-row-beta :document="document" :field="fields.articles" />
            <associations-input-row-beta :document="document" :field="fields.waypoints" />
            <associations-input-row-beta :document="document" :field="fields.routes" />
        </form-section>

    </edition-container-beta>
</template>

<script>

    import DocumentEditionViewMixin from './utils/DocumentEditionViewMixin'

    export default {
        mixins: [ DocumentEditionViewMixin ]
    }

</script>
