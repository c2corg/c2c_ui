<template>
    <edition-container v-if="document" :document="document" @save="save">

        <form-input-row :document="document" :field="fields.title"/>
        <form-input-row :document="document" :field="fields.editor" />
        <form-input-row :document="document" :field="fields.scale" />
        <form-input-row :document="document" :field="fields.code" />

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
