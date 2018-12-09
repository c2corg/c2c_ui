<template>
    <card-container :document="notClickable ? null : document">
        <document-title slot="header" :document="document"/>

        <div slot="row1" class="level">
            <card-region-item :document="document"/>
        </div>

        <div slot="row2" class="level is-nowrap">

            <span>
                <fa-icon class="has-text-primary" icon="tachometer-alt"/>
                <route-rating :document="document"/>
            </span>

            <card-elevation-item :elevation="document.elevation_max" class="is-ellipsed"/>

            <span
                v-if="document.height_diff_up"
                class="is-ellipsed"
                :title="$gettext('height_diff_up')">
                <icon-height-diff-up class="has-text-primary"/>
                {{ document.height_diff_up }}&nbsp;m
            </span>

            <span
                v-if="document.height_diff_difficulties"
                class="is-ellipsed"
                :title="$gettext('height_diff_difficulties')">
                <fa-icon icon="arrows-alt-v" class="has-text-primary"/>
                {{ document.height_diff_difficulties }}&nbsp;m
            </span>
        </div>

        <div slot="row3" class="level">
            <card-activities-item :activities="document.activities"/>

            <span class="has-text-primary"> <!-- Englobing span is mandatory for tooltip ?? -->
                <marker-gps-trace v-if="document.geometry.has_geom_detail" />
            </span>

            <span v-if="document.orientations && document.orientations.length!=0" class="is-ellipsed">
                <fa-icon icon="compass" class="has-text-primary"/>
                {{ document.orientations.join(", ") }}
            </span>

            <marker-quality :quality="document.quality"/>
        </div>
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
