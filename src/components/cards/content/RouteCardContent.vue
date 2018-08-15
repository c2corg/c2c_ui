<template>
    <div class="content">
        <card-region-item :document="document"/>

        <br>

        <route-rating :route="document"/>

        <card-elevation-item :elevation="document.elevation_max"/>

        <span v-if="document.height_diff_up">
            <base-icon iconClass="fas fa-bomb"/>
            {{document.height_diff_up}}&nbsp;m
        </span>


        <span v-if="document.height_diff_difficulties">
            <base-icon iconClass="fas fa-arrows-alt-v"/>
            {{document.height_diff_difficulties}}&nbsp;m
        </span>

        <br>

        <activities :activities="document.activities"/>

        <icon-geometry-detail v-if="document.geometry.has_geom_detail"/>

        <span v-if="document.orientations && document.orientations.length!=0">
            <base-icon iconClass="fas fa-compass"/>
            {{document.orientations.join(", ")}}
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
