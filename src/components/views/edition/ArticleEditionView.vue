<template>
    <edition-container
        v-if="document"
        :document="document"
        :locale="locale">
        <div>
            <edit-section :expanded="true" header="general information">
                <input-base :document="document" :base="locale" :field="fields.title" class="is-9" />
                <input-base :document="document" :field="fields.article_type" class="is-3" />
                <input-activities :document="document" class="is-6" />
                <input-checkboxes :document="document" :field="fields.categories" class="is-6" />
            </edit-section>

            <edit-section :document="document" :expanded="true" header="description">
                <input-base :document="document" :base="locale" :field="fields.summary" class="is-12"/>
                <input-base :document="document" :base="locale" :field="fields.description" class="is-12"/>
            </edit-section>

        </div>
    </edition-container>
</template>

<script>

    import mixins from './utils/mixins.js'

    export default {
        mixins : [
            mixins,
        ],
    }
</script>
