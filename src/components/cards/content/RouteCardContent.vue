<template>
    <div class="content">
        <card-region-item :document="document"/>

        <br>

        <route-rating :route="document"/>

        <card-elevation-item :elevation="document.elevation_max"/>

        <span v-if="document.height_diff_up">
            <i class="fas fa-bomb"/>
            {{document.height_diff_up}}&nbsp;m
        </span>


        <span v-if="document.height_diff_difficulties">
            <i class="fas fa-arrows-alt-v"></i>
            {{document.height_diff_difficulties}}&nbsp;m
        </span>

        <br>

        <activities :activities="document.activities"/>

        <span v-if="document.geometry.has_geom_detail">
            <i class="fas fa-flag"/>
        </span>

        <span v-if="document.orientations && document.orientations.length!=0">
            <i class="fas fa-compass"></i>
            {{document.orientations.join(", ")}}
        </span>

        <quality-icon :quality="document.quality"/>
    </div>
</template>

<script>
    import c2c from '@/js/c2c.js'

    import DocumentTitle from '@/components/utils/DocumentTitle'
    import QualityIcon from '@/components/utils/QualityIcon'
    import Activities from '@/components/utils/Activities'
    import RouteRating from '@/components/utils/RouteRating'
    import CardElevationItem from '@/components/cards/utils/CardElevationItem'
    import CardRegionItem from '@/components/cards/utils/CardRegionItem'

    export default {
        components: {
            DocumentTitle,
            QualityIcon,
            Activities,
            RouteRating,
            CardElevationItem,
            CardRegionItem
        },

        props: ['document'],


        data(){
            return {
                documentType: c2c.documentType
            }
        }
    }
</script>
