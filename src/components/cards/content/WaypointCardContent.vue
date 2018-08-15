<template>
    <div class="content">

        <card-region-item :document="document"/>

        <br>

        <card-elevation-item :elevation="document.elevation"/>

        <span v-if="document.slackline_types">
            <i class="fas fa-bomb"/>
            {{document.slackline_types}}
        </span>

        <icon-quality :quality="document.quality"/>

    </div>
</template>

<script>
    import Activities from '@/components/utils/Activities'
    import RouteRating from '@/components/utils/RouteRating'

    import CardElevationItem from '@/components/cards/utils/CardElevationItem'
    import CardRegionItem from '@/components/cards/utils/CardRegionItem'

    export default {
        components: {
            Activities,
            RouteRating,
            CardElevationItem,
            CardRegionItem
        },

        props: ['document'],
    }
</script>
