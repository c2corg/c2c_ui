<template>
    <div>

        <edit-section>
            <template slot="header">
                general information
            </template>

            <div class="columns">
                <div class="column">
                    <input-base :document="document" :base="locale" :field="localeFields.title"/>
                </div>
                <div class="column is-narrow">
                    <input-base :document="document" :field="fields.image_type" />
                </div>
            </div>

            <div class="columns">
                <div class="column">
                    <input-activities :document="document"/>
                </div>
                <div class="column">
                    <input-checkboxes :document="document" :field="fields.categories" />
                </div>
            </div>


            <div class="columns is-multiline">
                <div class="column">
                    <!--<input-base :document="document" :field="fields.author" />-->
                    <input-base :document="document" :field="fields.date_time" />
                </div>
                <div class="column">
                    <input-base :document="document" :field="fields.file_size" />
                </div>
                <div class="column">
                    <input-base :document="document" :field="fields.filename" />
                </div>
                <div class="column">
                    <input-base :document="document" :field="fields.height" />
                </div>
                <div class="column">
                    <input-base :document="document" :field="fields.width" />
                </div>
            </div>
        </edit-section>

        <edit-section>
            <template slot="header">
                geolocation
            </template>

            <input-base :document="document" :field="fields.elevation" />

        </edit-section>

        <edit-section>
            <template slot="header">
                camera settings
            </template>

            <div class="columns is-multiline">
                <div class="column">
                    <input-base :document="document" :field="fields.camera_name" />
                </div>
                <div class="column">
                    <input-base :document="document" :field="fields.fnumber" />
                </div>
                <div class="column">
                    <input-base :document="document" :field="fields.focal_length" />
                </div>
                <div class="column">
                    <input-base :document="document" :field="fields.exposure_time" />
                </div>
                <div class="column">
                    <input-base :document="document" :field="fields.iso_speed" />
                </div>
            </div>
        </edit-section>


        <edit-section>
            <template slot="header">
                general information
            </template>
            <input-base :document="document" :base="locale" :field="localeFields.summary"/>
            <input-base :document="document" :base="locale" :field="localeFields.description"/>
        </edit-section>

    </div>
</template>

<script>
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

        props : ["document", "locale", "objectDefinition"],

        data(){
            return {
                fields : this.objectDefinition.fields,
                localeFields : this.objectDefinition.localeFields,
            }
        },
    }
</script>
