<template>
    <div>
        <edit-section header="general information">

            <input-activities :document="document" class="is-6" />
            <input-checkboxes :document="document" :field="fields.categories" class="is-6" />

            <input-base :document="document" :locale="locale" :field="fields.summary" class="is-12"/>
            <input-base :document="document" :locale="locale" :field="fields.description" class="is-12"/>

        </edit-section>
    </div>
</template>

<script>
    import { props } from '@/js/properties.js'

    import InputBase from './utils/InputBase'
    import InputCheckboxes from './utils/InputCheckboxes'
    import InputActivities from './utils/InputActivities'
    import EditSection from './utils/EditSection'

    export default {
        components:{
            InputBase,
            InputCheckboxes,
            InputActivities,
            EditSection,
        },

        props : props.documentViewProperties,
    }
</script>
