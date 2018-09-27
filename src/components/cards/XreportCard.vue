<template>
    <card-container class="route-card" @click="go">
        <document-title slot="header" :document="document"/>

        <div slot="row1" class="level">
            <card-region-item :document="document" />

            <card-elevation-item :elevation="document.elevation"/>
        </div>

        <div slot="row2" class="level">
            <textual-array class="is-ellipsed" :array="document.event_type" />

        </div>

        <div slot="row3" class="level">
            <card-activities-item :activities="document.activities"/>

            <span class="is-nowrap">
                {{ document.date }}
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
