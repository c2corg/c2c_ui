<template>
    <card-container :document="notClickable ? null : document">
        <card-title>
            <document-title :document="document"/>
        </card-title>

        <card-row>
            <card-region-item :document="document" />

            <card-elevation-item :elevation="document.elevation"/>
        </card-row>

        <card-row>
            <textual-array
                class="is-ellipsed"
                :array="document.event_type"
                i18n
                i18n-context="event_types"/>

        </card-row>

        <card-row>
            <card-activities-item :activities="document.activities"/>

            <span class="is-nowrap">
                {{ $moment.parseDate(document.date).locale(this.$language.current).format("LL") }}
            </span>

            <marker-quality :quality="document.quality"/>
        </card-row>

    </card-container>
</template>

<script>

    import { documentCardMixin } from './utils/mixins.js'

    export default {
        mixins: [
            documentCardMixin
        ]
    }
</script>
