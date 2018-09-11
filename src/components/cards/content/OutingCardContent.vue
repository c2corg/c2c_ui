<template>
    <div class="content">
        <div class="card-row level">
            <span class="card-region">
                <card-region-item :document="document"/>
            </span>

            <span class="card-author is-pulled-right">
                <base-icon class="has-text-primary" iconClass="fas fa-pen"/>
                {{document.author.name}}
            </span>
        </div>

        <div class="card-row level">
            <span>
                <base-icon  class="has-text-primary" iconClass="fas fa-tachometer-alt"/>
                <outing-rating :outing="document"/>
            </span>

            <span v-if="document.elevation_max">
                <base-icon iconClass="fas fa-bomb"/>
                {{document.elevation_max}}&nbsp;m
            </span>

            <span v-if="document.height_diff_up">
                <base-icon iconClass="fas fa-bomb"/>
                {{document.height_diff_up}}&nbsp;m
            </span>
        </div>

        <div class="card-row level">
            <activities class="has-text-primary" :activities="document.activities"/>

            <icon-geometry-detail v-if="document.geometry.has_geom_detail" class="has-text-primary"/>
            <icon-document type="image" v-if="document.img_count != 0"/>

            {{document.date_start}}
            <icon-condition :condition="document.condition_rating"/>
            <icon-quality :quality="document.quality"/>
        </div>

    </div>
</template>

<script>

    import CardRegionItem from '@/components/cards/utils/CardRegionItem'

    export default {
        components: {
            CardRegionItem
        },

        props: ['document'],
    }
</script>

<style scoped lang="scss">

@import '@/assets/sass/main.scss';

.card-author{
    white-space: nowrap;
}

.card-region{
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}

.card-row{
    border-top:1px solid $grey-lighter;
    padding:0.4rem 0rem;
    font-size:0.9rem;
    margin:0 ! important;
}

.card-row:last-child{
    padding-bottom:0;
}

</style>
