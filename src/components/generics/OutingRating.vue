<template>
    <span>
        <span
            v-for="rating of $options.ratings"
            :key="rating"
            v-if="outing[rating]"
            v-tooltip="tooltips ? $gettext(rating) : null">
            {{ outing[rating] }}
        </span>
    </span>

</template>

<script>

    export default {
        props: {
            outing: {
                type:Object,
                required:true,
            },
            tooltips: {
                type:Boolean,
                default:false,
            }
        },

        ratings:[
            'global_rating',
            'rock_free_rating',
            'ice_rating',
            'via_ferrata_rating',
            'engagement_rating',
            'equipment_rating',
            'ski_rating',
            'labande_global_rating',
            'hiking_rating',
            'snowshoe_rating',
            'mtb_up_rating',
            'mtb_down_rating',
        ]
    }

</script>
