<template>
    <document-view-container
        v-if="document"
        :document="document"
        :locale="locale"

        :version="version"
        :previous-version-id="previousVersionId"
        :next-version-id="nextVersionId">

        <div class="columns">
            <div class="column is-3">

                <content-box>

                    <label-value label="activities">
                        <activities :activities="document.activities" class="is-size-3 has-text-primary"/>
                    </label-value>
                                                
                    <label-value v-if="document.author" label="author">
                        <author-link :author="document.author"/>
                    </label-value>

                    <field-view :document="document" :field="fields.event_type"/>

                    <label-value v-if="document.associations.users.length" label="participants">
                        <users-links :users="document.associations.users"/>
                    </label-value>

                    <field-view :document="document" :field="fields.avalanche_level"/>
                    <field-view :document="document" :field="fields.avalanche_slope"/>
                    <field-view :document="document" :field="fields.elevation"/>
                    <field-view :document="document" :field="fields.nb_participants"/>
                    <field-view :document="document" :field="fields.nb_impacted"/>
                    <field-view :document="document" :field="fields.rescue"/>
                    <field-view :document="document" :field="fields.severity"/>
                </content-box>

                <map-box :document="document"/>

                <license-box cc="by-nc-nd"/>
            </div>

            <div class="column">
                <content-box>
                    <markdown-section :document="document" :locale="locale" :field="fields.summary"/>
                    <markdown-section :document="document" :locale="locale" :field="fields.description"/>
                    <markdown-section :document="document" :locale="locale" :field="fields.place"/>
                    <markdown-section :document="document" :locale="locale" :field="fields.route_study"/>
                    <markdown-section :document="document" :locale="locale" :field="fields.conditions"/>
                    <markdown-section :document="document" :locale="locale" :field="fields.training"/>
                    <markdown-section :document="document" :locale="locale" :field="fields.motivations"/>
                    <markdown-section :document="document" :locale="locale" :field="fields.group_management"/>
                    <markdown-section :document="document" :locale="locale" :field="fields.risk"/>
                    <markdown-section :document="document" :locale="locale" :field="fields.time_management"/>
                    <markdown-section :document="document" :locale="locale" :field="fields.safety"/>
                    <markdown-section :document="document" :locale="locale" :field="fields.increase_impact"/>
                    <markdown-section :document="document" :locale="locale" :field="fields.reduce_impact"/>
                    <markdown-section :document="document" :locale="locale" :field="fields.modifications"/>
                    <markdown-section :document="document" :locale="locale" :field="fields.other_comments"/>
                </content-box>

                <comments-box :document="document" :locale="locale" />

            </div>
        </div>
    </document-view-container>
</template>

<script>
    import mixins from "./utils/mixins.js"

    export default {
        mixins : [
            mixins,
        ],
    }
</script>
