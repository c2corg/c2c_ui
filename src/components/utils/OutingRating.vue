<template>
    <span>
        <span v-if="outing.global_rating" >
            {{outing.global_rating}}
        </span>
        <span v-if="outing.rock_free_rating" >
            {{outing.rock_free_rating}}
        </span>
        <span v-if="outing.rock_required_rating" >>
            {{outing.rock_required_rating}}
        </span>
        <span v-if="outing.engagement_rating" >
            {{outing.engagement_rating}}
        </span>
    
        <span v-if="outing.risk_rating" >
            {{outing.risk_rating}}
        </span>
    
        <span v-if="outing.equipment_rating" >
            {{outing.equipment_rating}}
        </span>
        <span v-if="outing.exposition_rock_rating" >
            {{outing.exposition_rock_rating}}
        </span>
        <span v-if="outing.ice_rating" >
            {{outing.ice_rating}}
        </span>
        <span v-if="outing.mixed_rating" >
            {{outing.mixed_rating}}
        </span>
        <span v-if="outing.ski_rating" >
            {{outing.ski_rating}}
        </span>
    </span>
    
</template>

<script>

    export default {
        props: ['outing'],
    }

</script>