<template>
    <div class="content">

        <card-region-item :document="document"/>

        <span>
            <i class="fas fa-pen"/>
            {{document.author.name}}
        </span>

        <br>

        <outing-rating :outing="document"/>

        <span v-if="document.elevation_max">
            <i class="fas fa-bomb"/>
            {{document.elevation_max}}&nbsp;m
        </span>

        <span v-if="document.height_diff_up">
            <i class="fas fa-bomb"/>
            {{document.height_diff_up}}&nbsp;m
        </span>

        <br>

        <activities :activities="document.activities"/>

        <span v-if="document.geometry.has_geom_detail">
            <i class="fas fa-flag"/>
        </span>

        <span v-if="document.img_count != 0">
            <i class="fas fa-camera"/>
        </span>

        {{document.date_start}}
        <condition-icon :condition="document.condition_rating"/>
        <quality-icon :quality="document.quality"/>

    </div>
</template>

<script>
    import c2c from '@/js/c2c.js'

    import ConditionIcon from '@/components/utils/ConditionIcon'
    import QualityIcon from '@/components/utils/QualityIcon'
    import Activities from '@/components/utils/Activities'
    import OutingRating from '@/components/utils/OutingRating'

    import CardRegionItem from '@/components/cards/utils/CardRegionItem'

    export default {
        components: {
            ConditionIcon,
            Activities,
            OutingRating,
            QualityIcon,
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