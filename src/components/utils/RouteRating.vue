<template>
    <span>
        <span v-if="route.global_rating" >
            {{route.global_rating}}
        </span>
        <span v-if="route.rock_free_rating" >
            {{route.rock_free_rating}}</span><span v-if="route.rock_required_rating" >&gt;{{route.rock_required_rating}}
        </span>
        <span v-if="route.engagement_rating" >
            {{route.engagement_rating}}
        </span>

        <span v-if="route.risk_rating" >
            {{route.risk_rating}}
        </span>

        <span v-if="route.equipment_rating" >
            {{route.equipment_rating}}
        </span>
        <span v-if="route.exposition_rock_rating" >
            {{route.exposition_rock_rating}}
        </span>
        <span v-if="route.ice_rating" >
            {{route.ice_rating}}
        </span>
        <span v-if="route.mixed_rating" >
            {{route.mixed_rating}}
        </span>
        <span v-if="route.ski_rating" >
            {{route.ski_rating}}
        </span>
    </span>

</template>

<script>

    export default {
        props: ['route'],
    }
</script>
