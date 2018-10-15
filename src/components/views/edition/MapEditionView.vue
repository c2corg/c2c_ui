<template>
    <edition-container
        v-if="document"
        :document="document"
        :locale="locale">

        <field-simple :document="document" :base="locale" :field="fields.title"/>
        <field-simple :document="document" :field="fields.editor" />
        <field-simple :document="document" :field="fields.scale" />
        <field-simple :document="document" :field="fields.code" />

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
