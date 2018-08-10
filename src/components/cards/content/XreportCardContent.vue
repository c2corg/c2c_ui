<template>
    <div class="content">
        <span>{{document.event_type}}</span>

        <card-region-item :document="document"/>

        <br>

        <span v-if="document.elevation">
            <i class="fas fa-bomb"/>
            {{document.elevation}}&nbsp;m
        </span>

        <br>

        <activities :activities="document.activities"/>

        <span>
            {{document.date}}
        </span>
        <quality-icon :quality="document.quality"/>

    </div>
</template>

<script>
    import c2c from '@/js/c2c.js'

    import DocumentTitle from '@/components/utils/DocumentTitle'
    import Activities from '@/components/utils/Activities'
    import QualityIcon from '@/components/utils/QualityIcon'
    import CardRegionItem from '@/components/cards/utils/CardRegionItem'

    export default {
        components: {
            DocumentTitle,
            Activities,
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