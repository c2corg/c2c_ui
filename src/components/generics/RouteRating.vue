<template>
    <span>
        <span v-if="document.global_rating" v-tooltip="'global rating'">
            {{ document.global_rating }}
        </span>

        <span>
            <span v-if="document.rock_free_rating" v-tooltip="'rock free rating'">
                {{ document.rock_free_rating }}<!--
            --></span><!--
            --><span v-if="document.rock_required_rating" v-tooltip="'rock required rating'"><!--
            -->&gt;{{ document.rock_required_rating }}
            </span>
        </span>

        <span v-if="document.aid_rating" v-tooltip="'aid rating'">
            {{ document.aid_rating }}
        </span>

        <span v-if="document.engagement_rating" v-tooltip="'engagement rating'">
            {{ document.engagement_rating }}
        </span>

        <span v-if="document.risk_rating" v-tooltip="'risk rating'">
            {{ document.risk_rating }}
        </span>

        <span v-if="document.equipment_rating" v-tooltip="'equipment rating'">
            {{ document.equipment_rating }}
        </span>
        <span v-if="document.exposition_rock_rating" v-tooltip="'exposition rock rating'">
            {{ document.exposition_rock_rating }}
        </span>
        <span v-if="document.ice_rating" v-tooltip="'ice rating'">
            {{ document.ice_rating }}
        </span>
        <span v-if="document.mixed_rating" v-tooltip="'mixed rating'">
            {{ document.mixed_rating }}
        </span>
        <span v-if="document.ski_rating" v-tooltip="'ski rating'">
            {{ document.ski_rating }}
        </span>
        <span v-if="document.hiking_rating" v-tooltip="'hiking rating'">
            {{ document.hiking_rating }}
        </span>
        <span v-if="document.mtb_up_rating" v-tooltip="'mtb up rating'">
            {{ document.mtb_up_rating }}
        </span>
        <span v-if="document.mtb_down_rating" v-tooltip="'mtb down rating'">
            {{ document.mtb_down_rating }}
        </span>
        <span v-if="document.hiking_mtb_exposition" v-tooltip="'hiking mtb exposition'">
            {{ document.hiking_mtb_exposition }}
        </span>
    </span>

</template>

<script>
    import { requireDocumentProperty } from '@/js/propertiesMixins.js'

    export default {
        mixins: [ requireDocumentProperty ],
    }
</script>
