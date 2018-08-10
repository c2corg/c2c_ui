<template>
    <div class="content">

        <card-region-item :document="document"/>

        <br>

        <card-elevation-item :elevation="document.elevation"/>

        <span v-if="document.slackline_types">
            <i class="fas fa-bomb"/>
            {{document.slackline_types}}
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
            Activities,
            RouteRating,
            QualityIcon,
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