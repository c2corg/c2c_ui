<template>
    <span>
        <span v-if="route.global_rating" v-tooltip="'global rating'">
            {{ route.global_rating }}
        </span>

        <span>
            <span v-if="route.rock_free_rating" v-tooltip="'rock free rating'">
                {{ route.rock_free_rating }}<!--
            --></span><!--
            --><span v-if="route.rock_required_rating" v-tooltip="'rock required rating'"><!--
            -->&gt;{{ route.rock_required_rating }}
            </span>
        </span>

        <span v-if="route.aid_rating" v-tooltip="'aid rating'">
            {{ route.aid_rating }}
        </span>

        <span v-if="route.engagement_rating" v-tooltip="'engagement rating'">
            {{ route.engagement_rating }}
        </span>

        <span v-if="route.risk_rating" v-tooltip="'risk rating'">
            {{ route.risk_rating }}
        </span>

        <span v-if="route.equipment_rating" v-tooltip="'equipment rating'">
            {{ route.equipment_rating }}
        </span>
        <span v-if="route.exposition_rock_rating" v-tooltip="'exposition rock rating'">
            {{ route.exposition_rock_rating }}
        </span>
        <span v-if="route.ice_rating" v-tooltip="'ice rating'">
            {{ route.ice_rating }}
        </span>
        <span v-if="route.mixed_rating" v-tooltip="'mixed rating'">
            {{ route.mixed_rating }}
        </span>
        <span v-if="route.ski_rating" v-tooltip="'ski rating'">
            {{ route.ski_rating }}
        </span>
        <span v-if="route.hiking_rating" v-tooltip="'hiking rating'">
            {{ route.hiking_rating }}
        </span>
        <span v-if="route.mtb_up_rating" v-tooltip="'mtb up rating'">
            {{ route.mtb_up_rating }}
        </span>
        <span v-if="route.mtb_down_rating" v-tooltip="'mtb down rating'">
            {{ route.mtb_down_rating }}
        </span>
        <span v-if="route.hiking_mtb_exposition" v-tooltip="'hiking mtb exposition'">
            {{ route.hiking_mtb_exposition }}
        </span>
    </span>

</template>

<script>
    import { prop } from '@/js/properties.js'
    export default {
        props: {
            route:prop.requiredObject,
        },
    }
</script>
