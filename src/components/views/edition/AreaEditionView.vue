<template>
    <edition-container v-if="document" :document="document" @save="save">

        <form-input-row :document="document" :field="fields.title"/>
        <form-input-row :document="document" :field="fields.area_type"/>
        <form-input-row :document="document" :field="fields.summary"/>
        <form-input-row :document="document" :field="fields.description"/>

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
