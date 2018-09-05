<template>
    <div class="content">

        <card-region-item :document="document"/>

        <span>
            <base-icon iconClass="fas fa-pen"/>
            {{document.author.name}}
        </span>

        <br>

        <outing-rating :outing="document"/>

        <span v-if="document.elevation_max">
            <base-icon iconClass="fas fa-bomb"/>
            {{document.elevation_max}}&nbsp;m
        </span>

        <span v-if="document.height_diff_up">
            <base-icon iconClass="fas fa-bomb"/>
            {{document.height_diff_up}}&nbsp;m
        </span>

        <br>

        <activities :activities="document.activities"/>

        <icon-geometry-detail v-if="document.geometry.has_geom_detail"/>
        <icon-document type="image" v-if="document.img_count != 0"/>

        {{document.date_start}}
        <icon-condition :condition="document.condition_rating"/>
        <icon-quality :quality="document.quality"/>

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
