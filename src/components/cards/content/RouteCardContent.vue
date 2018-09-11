<template>
    <div class="content">
        <div class="card-row">
            <card-region-item :document="document"/>
        </div>

        <div class="card-row level">
            <span>
                <base-icon iconClass="fas fa-tachometer-alt"/>
                <route-rating :route="document"/>
            </span>

            <card-elevation-item :elevation="document.elevation_max"/>

            &nbsp;
            <span v-if="document.height_diff_difficulties">
                <base-icon iconClass="fas fa-arrows-alt-v"/>
                {{document.height_diff_difficulties}}&nbsp;m
            </span>
        </div>

        <div class="card-row level">

            <activities class="has-text-primary is-size-3" :activities="document.activities"/>

            <icon-geometry-detail v-if="document.geometry.has_geom_detail"/>

            <span v-if="document.orientations && document.orientations.length!=0">
                <base-icon iconClass="fas fa-compass"/>
                {{document.orientations.join(", ")}}
            </span>

            <icon-quality :quality="document.quality"/>
        </div>

    </div>
</template>

<script>
    import CardElevationItem from '@/components/cards/utils/CardElevationItem'
    import CardRegionItem from '@/components/cards/utils/CardRegionItem'

    export default {
        components: {
            CardElevationItem,
            CardRegionItem
        },

        props: ['document'],
    }
</script>

<style scoped lang="scss">

@import '@/assets/sass/main.scss';

.card-row{
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.card-row{
    border-top:1px solid $grey-lighter;
    padding:0.3rem 0rem;
    font-size:0.9rem;
    margin:0 ! important;
}

.card-row:last-child{
    padding-bottom:0;
}

</style>
