<template>
    <div class="card-container">
        <component
            :is="documentType + '-card'"
            :document="document"
            :not-clickable="notClickable"
            :highlighted="highlighted"/>
        <delete-button
            v-if="showDeleteButton"
            @click="$emit('delete')"
            class="delete-button"/>
    </div>
</template>

<script>

    import { requireDocumentProperty } from '@/js/properties-mixins'

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
            XreportCard
        },

        mixins: [requireDocumentProperty],

        props: {
            showDeleteButton: {
                type: Boolean,
                default: false
            },

            notClickable: {
                type: Boolean,
                default: false
            },

            highlighted: {
                type: Boolean,
                default: false
            }
        }
    }

</script>

<style scoped lang="scss">

    .card-container{
        position:relative;
    }

    .delete-button{
        position:absolute;
        top:-0.5rem;
        right:-0.5rem;
        font-size:2rem;
    }

</style>
