<template>
    <card-container class="route-card" @click="go">
        <div slot="header" class="level">
            <document-title :document="document" class="is-ellipsed"/>
            <icon-condition :condition="document.condition_rating" class="is-pulled-right"/>
        </div>

        <div slot="row1" class="level">
            <card-region-item :document="document" />

            <span class="is-nowrap">
                <fa-icon class="has-text-primary" icon="pen"/>
                {{ document.author.name }}
            </span>
        </div>

        <div slot="row2" class="level">
            <span>
                <fa-icon class="has-text-primary" icon="tachometer-alt"/>
                <outing-rating :outing="document"/>
            </span>

            <span v-if="document.elevation_max">
                <fa-icon icon="bomb"/>
                {{ document.elevation_max }}&nbsp;m
            </span>

            <span v-if="document.height_diff_up">
                <fa-icon icon="bomb"/>
                {{ document.height_diff_up }}&nbsp;m
            </span>
        </div>

        <div slot="row3" class="level">
            <activities :activities="document.activities" class="has-text-primary is-ellipsed"/>

            <span class="has-text-primary is-nowrap">
                <marker-gps-trace v-if="document.geometry.has_geom_detail" />
                <marker-image-count v-if="document.img_count != 0" :image-count="document.img_count"/>
            </span>

            <span class="is-nowrap">
                {{ document.date_start }}
            </span>

            <marker-quality :quality="document.quality"/>
        </div>
    </card-container>
</template>

<script>
    import { props } from '@/js/properties.js'
    import constants from '@/js/constants.js'

    import CardContainer from './utils/CardContainer'
    import CardElevationItem from './utils/CardElevationItem'
    import CardRegionItem from './utils/CardRegionItem'

    export default {
        components: {
            CardContainer,
            CardElevationItem,
            CardRegionItem,
        },

        props: props.requiredDocument,

        methods:{
            go(){
                this.$router.push({
                    name: constants.getDocumentType(this.document.type),
                    params: { id: this.document.document_id }
                })
            }
        },
    }
</script>
