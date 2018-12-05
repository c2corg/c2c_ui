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
                <form-input-row :document="document" :field="fields.article_type" />
                <form-input-row :document="document" :field="fields.activities"/>
                <form-input-row :document="document" :field="fields.categories" />
                <form-input-row :document="document" :field="fields.summary"/>
                <form-input-row :document="document" :field="fields.description"/>

                <quality-input-row :document="document" />
            </tab-item>

            <tab-item :title="$gettext('associations')">
                <associations-input-row :document="document" :field="fields.articles" />
                <associations-input-row :document="document" :field="fields.waypoints" />
                <associations-input-row :document="document" :field="fields.outings" />
                <associations-input-row :document="document" :field="fields.routes" />
                <associations-input-row :document="document" :field="fields.books" />
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
