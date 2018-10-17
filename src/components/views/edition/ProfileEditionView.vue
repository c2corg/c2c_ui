<template>
    <edition-container v-if="document" :document="document" @save="save">

        <form-input-row :document="document" :field="fields.activities" />
        <form-input-row :document="document" :field="fields.categories" />

        <form-input-row :document="document" :locale="locale" :field="fields.summary"/>
        <form-input-row :document="document" :locale="locale" :field="fields.description"/>

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
