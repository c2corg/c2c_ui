<template>
    <span>
        <span v-if="document.global_rating" v-tooltip="$gettext('global_rating')">
            {{ document.global_rating }}
        </span>

        <span>
            <span v-if="document.rock_free_rating" v-tooltip="$gettext('rock_free_rating')">
                {{ document.rock_free_rating }}<!--
            --></span><!--
            --><span v-if="document.rock_required_rating" v-tooltip="$gettext('rock_required_rating')"><!--
            -->&gt;{{ document.rock_required_rating }}
            </span>
        </span>

        <span v-if="document.aid_rating" v-tooltip="$gettext('aid_rating')">
            {{ document.aid_rating }}
        </span>

        <span v-if="document.engagement_rating" v-tooltip="$gettext('engagement_rating')">
            {{ document.engagement_rating }}
        </span>

        <span v-if="document.risk_rating" v-tooltip="$gettext('risk_rating')">
            {{ document.risk_rating }}
        </span>

        <span v-if="document.equipment_rating" v-tooltip="$gettext('equipment_rating')">
            {{ document.equipment_rating }}
        </span>
        <span v-if="document.exposition_rock_rating" v-tooltip="$gettext('exposition_rock_rating')">
            {{ document.exposition_rock_rating }}
        </span>
        <span v-if="document.ice_rating" v-tooltip="$gettext('ice_rating')">
            {{ document.ice_rating }}
        </span>
        <span v-if="document.mixed_rating" v-tooltip="$gettext('mixed_rating')">
            {{ document.mixed_rating }}
        </span>
        <span v-if="document.ski_rating" v-tooltip="$gettext('ski_rating')">
            {{ document.ski_rating }}
        </span>
        <span v-if="document.hiking_rating" v-tooltip="$gettext('hiking_rating')">
            {{ document.hiking_rating }}
        </span>
        <span v-if="document.mtb_up_rating" v-tooltip="$gettext('mtb_up_rating')">
            {{ document.mtb_up_rating }}
        </span>
        <span v-if="document.mtb_down_rating" v-tooltip="$gettext('mtb_down_rating')">
            {{ document.mtb_down_rating }}
        </span>
        <span v-if="document.hiking_mtb_exposition" v-tooltip="$gettext('hiking_mtb_exposition')">
            {{ document.hiking_mtb_exposition }}
        </span>
    </span>

</template>

<script>
    import { requireDocumentProperty } from '@/js/properties-mixins'

    export default {
        mixins: [ requireDocumentProperty ]
    }
</script>
