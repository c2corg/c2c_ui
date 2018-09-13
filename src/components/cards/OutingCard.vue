<template>
    <card-container class="route-card" @click="go">
        <div slot="header" class="level">
            <document-title :document="document" class="is-ellipsed"/>
            <icon-condition :condition="document.condition_rating" class="is-pulled-right"/>
        </div>

        <div slot="row1" class="level">
            <span class="is-ellipsed">
                <card-region-item :document="document" class="is-ellipsed"/>
            </span>

            <span class="is-nowrap is-pulled-right">
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
            <activities :activities="document.activities" class="has-text-primary"/>

            <span class="has-text-primary">
                <icon-geometry-detail v-if="document.geometry.has_geom_detail" />
                <icon-document v-if="document.img_count != 0" type="image"/>
            </span>

            {{ document.date_start }}
            <icon-quality :quality="document.quality"/>
        </div>
    </card-container>
</template>

<script>
    import CardContainer from './utils/CardContainer'
    import CardElevationItem from './utils/CardElevationItem'
    import CardRegionItem from './utils/CardRegionItem'

    import constants from '@/js/constants.js'

    export default {
        components: {
            CardContainer,
            CardElevationItem,
            CardRegionItem
        },

        props: {
            document: {
                type: Object,
                required: true,
            }
        },

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
