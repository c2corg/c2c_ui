<template>
    <card-container class="route-card" @click="go">
        <document-title slot="header" :document="document"/>

        <div slot="row1" class="level">
            <card-region-item :document="document"/>
        </div>

        <div slot="row2" class="level">
            <card-elevation-item :elevation="document.elevation"/>

            <span v-if="document.slackline_types">
                <fa-icon icon="bomb"/>
                {{ document.slackline_types }}
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
