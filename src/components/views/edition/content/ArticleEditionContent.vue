<template>
    <div>
        <edit-section :expanded="true" header="general information">
            <input-base :document="document" :base="locale" :field="fields.title" class="is-9" />
            <input-base :document="document" :field="fields.article_type" class="is-3" />
            <input-activities :document="document" class="is-6" />
            <input-checkboxes :document="document" :field="fields.categories" class="is-6" />
        </edit-section>

        <edit-section :document="document" :expanded="true" header="description">
            <input-base :document="document" :base="locale" :field="fields.summary" class="is-12"/>
            <input-base :document="document" :base="locale" :field="fields.description" class="is-12"/>
        </edit-section>

    </div>
</template>

<script>
    import { props } from '@/js/properties.js'

    import InputBase from './utils/InputBase'
    import InputActivities from './utils/InputActivities'
    import InputCheckboxes from './utils/InputCheckboxes'
    import EditSection from './utils/EditSection'

    export default {
        components:{
            InputBase,
            InputActivities,
            InputCheckboxes,
            EditSection,
        },

        props : props.documentViewProperties,
    }
</script>
