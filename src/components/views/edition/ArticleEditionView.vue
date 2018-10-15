<template>
    <edition-container
        v-if="document"
        :document="document"
        :locale="locale">

        <field-simple :document="document" :base="locale" :field="fields.title" />
        <field-simple :document="document" :field="fields.article_type" />
        <field-simple :document="document" :field="fields.activities"/>
        <field-simple :document="document" :field="fields.categories" />
        <field-simple :document="document" :base="locale" :field="fields.summary"/>
        <field-simple :document="document" :base="locale" :field="fields.description"/>

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
