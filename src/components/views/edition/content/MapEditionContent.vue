<template>
    <div>
        <edit-section :document="document" expanded="true" header="general information">
            <input-base :document="document" :base="locale" :field="fields.title" class="is-12"/>

            <input-base :document="document" :field="fields.editor" />
            <input-base :document="document" :field="fields.scale" />
            <input-base :document="document" :field="fields.code" />
        </edit-section>
    </div>
</template>

<script>
    import InputBase from './utils/InputBase'
    import EditSection from './utils/EditSection'

    export default {
        components:{
            InputBase,
            EditSection,
        },

        props : ["document", "locale", "fields"],
    }
</script>
