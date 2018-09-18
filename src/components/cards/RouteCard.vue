<template>
    <card-container class="route-card" @click="go">
        <document-title slot="header" :document="document"/>

        <div slot="row1" class="level">
            <card-region-item :document="document"/>
        </div>

        <div slot="row2" class="level is-nowrap">

            <span>
                <fa-icon class="has-text-primary" icon="tachometer-alt"/>
                <route-rating :route="document"/>
            </span>

            <card-elevation-item :elevation="document.elevation_max" class="is-ellipsed"/>

            <span v-if="document.height_diff_difficulties" class="is-ellipsed">
                <fa-icon icon="arrows-alt-v" class="has-text-primary"/>
                {{ document.height_diff_difficulties }}&nbsp;m
            </span>
        </div>

        <div slot="row3" class="level">
            <card-activities-item :activities="document.activities"/>

            <marker-gps-trace v-if="document.geometry.has_geom_detail" class="has-text-primary"/>

            <span v-if="document.orientations && document.orientations.length!=0" class="is-ellipsed">
                <fa-icon icon="compass" class="has-text-primary"/>
                {{ document.orientations.join(", ") }}
            </span>

            <marker-quality :quality="document.quality"/>
        </div>
    </card-container>
</template>

<script>

    import cardMixins from './utils/mixins.js'

    export default {
        mixins: [
            cardMixins,
        ],
    }
</script>
