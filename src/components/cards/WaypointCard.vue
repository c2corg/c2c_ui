<template>
    <card-container :document="notClickable ? null : document">
        <span slot="header">
            <icon-waypoint-type :waypoint-type="document.waypoint_type"/>
            <document-title :document="document"/>
        </span>

        <div slot="row1" class="level">
            <card-region-item :document="document"/>
        </div>

        <div slot="row2" class="level">
            <card-elevation-item :elevation="document.elevation"/>

            <textual-array :array="document.slackline_types" />

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
