<template>
    <edition-container
        v-if="document"
        :document="document"
        :locale="locale">
        <div>
            <edit-section header="general information">

                <input-activities :document="document" class="is-6" />
                <input-checkboxes :document="document" :field="fields.categories" class="is-6" />

                <input-base :document="document" :locale="locale" :field="fields.summary" class="is-12"/>
                <input-base :document="document" :locale="locale" :field="fields.description" class="is-12"/>

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
