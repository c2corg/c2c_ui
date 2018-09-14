<template>
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
</template>

<script>
    import { props } from '@/js/properties.js'

    import InputBase from './utils/InputBase'
    import EditSection from './utils/EditSection'

    export default {
        components:{
            InputBase,
            EditSection,
        },

        props : props.documentViewProperties,
    }
</script>
