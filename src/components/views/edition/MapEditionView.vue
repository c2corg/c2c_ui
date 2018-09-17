<template>
    <edition-container
        v-if="document"
        :document="document"
        :locale="locale">
        <div>
            <edit-section :document="document" :expanded="true" header="general information">
                <input-base :document="document" :base="locale" :field="fields.title" class="is-12"/>

                <input-base :document="document" :field="fields.editor" />
                <input-base :document="document" :field="fields.scale" />
                <input-base :document="document" :field="fields.code" />
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
