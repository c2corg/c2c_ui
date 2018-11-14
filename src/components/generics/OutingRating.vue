<template>
    <span>
        <span v-if="outing.global_rating" >
            {{ outing.global_rating }}
        </span>
        <span v-if="outing.rock_free_rating" >
            {{ outing.rock_free_rating }}
        </span>
        <span v-if="outing.ice_rating" >
            {{ outing.ice_rating }}
        </span>
        <span v-if="outing.via_ferrata_rating" >
            {{ outing.via_ferrata_rating }}
        </span>
        <span v-if="outing.engagement_rating" >
            {{ outing.engagement_rating }}
        </span>
        <span v-if="outing.equipment_rating" >
            {{ outing.equipment_rating }}
        </span>
        <span v-if="outing.ski_rating" >
            {{ outing.ski_rating }}
        </span>
        <span v-if="outing.labande_global_rating" >
            {{ outing.labande_global_rating }}
        </span>
        <span v-if="outing.hiking_rating" >
            {{ outing.hiking_rating }}
        </span>
        <span v-if="outing.snowshoe_rating" >
            {{ outing.snowshoe_rating }}
        </span>
        <span v-if="outing.mtb_up_rating" >
            {{ outing.mtb_up_rating }}
        </span>
        <span v-if="outing.mtb_down_rating" >
            {{ outing.mtb_down_rating }}
        </span>
    </span>

</template>

<script>

    export default {
        props: {
            outing: {
                type:Object,
                required:true,
            }
        }
    }

</script>
