<template>
    <edition-container
        v-if="document"
        :document="document"
        :locale="locale">

        <div>
            <edit-section :document="document" :expanded="true" header="general informations">
                <input-base :document="document" :base="locale" :field="fields.title"/>
                <input-base :document="document" :field="fields.area_type" class="is-narrow"/>
            </edit-section>

            <edit-section :document="document" :expanded="true" header="Description">
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
