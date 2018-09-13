<template>
    <card-container class="route-card" @click="go">
        <document-title slot="header" :document="document"/>

        <div slot="row1" class="is-ellipsed">
            <card-region-item :document="document" class="is-ellipsed"/>
        </div>

        <div slot="row2" class="level">
            <span class="is-ellipsed" >
                <fa-icon class="has-text-primary" icon="tachometer-alt"/>
                <route-rating :route="document"/>
            </span>

            <card-elevation-item :elevation="document.elevation_max" class="is-nowrap"/>

            &nbsp;
            <span v-if="document.height_diff_difficulties" class="is-nowrap">
                <fa-icon icon="arrows-alt-v" class="has-text-primary"/>
                {{document.height_diff_difficulties}}&nbsp;m
            </span>
        </div>

        <div slot="row3" class="level">
            <activities :activities="document.activities" class="has-text-primary is-size-4 is-ellipsed"/>

            <icon-geometry-detail v-if="document.geometry.has_geom_detail" class="has-text-primary"/>

            <span v-if="document.orientations && document.orientations.length!=0" class="is-ellipsed">
                <fa-icon icon="compass" class="has-text-primary"/>
                {{document.orientations.join(", ")}}
            </span>

            <icon-quality :quality="document.quality"/>
        </div>
    </card-container>
</template>

<script>

    import constants from '@/js/constants.js'

    import CardContainer from './utils/CardContainer'
    import CardElevationItem from './utils/CardElevationItem'
    import CardRegionItem from './utils/CardRegionItem'

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
