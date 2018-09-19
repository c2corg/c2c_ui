<template>
    <component :is="type + '-card'" :document="document"/>
</template>

<script>

    import { requireDocumentProperty } from '@/js/propertiesMixins.js'
    import constants from '@/js/constants.js'

    import AreaCard from './AreaCard'
    import ArticleCard from './ArticleCard'
    import BookCard from './BookCard'
    import MapCard from './MapCard'
    import OutingCard from './OutingCard'
    import ProfileCard from './ProfileCard'
    import RouteCard from './RouteCard'
    import WaypointCard from './WaypointCard'
    import XreportCard from './XreportCard'

    export default {
        components: {
            AreaCard,
            ArticleCard,
            BookCard,
            MapCard,
            OutingCard,
            ProfileCard,
            RouteCard,
            WaypointCard,
            XreportCard,
        },

        mixins : [requireDocumentProperty],

        computed:{
            type(){
                return constants.getDocumentType(this.document.type)
            }
        }
    }

</script>
