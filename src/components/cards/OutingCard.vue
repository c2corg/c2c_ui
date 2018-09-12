<template>
    <card-container class="route-card" @click="go">
        <div  slot="header" class="level">
            <document-title :document="document" class="is-ellipsed"/>
            <icon-condition class="is-pulled-right" :condition="document.condition_rating"/>
        </div>

        <div slot="row1" class="level">
            <span class="is-ellipsed">
                <card-region-item :document="document" class="is-ellipsed"/>
            </span>

            <span class="is-nowrap is-pulled-right">
                <base-icon class="has-text-primary" iconClass="fas fa-pen"/>
                {{document.author.name}}
            </span>
        </div>

        <div slot="row2" class="level">
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

        <div slot="row3" class="level">
            <activities class="has-text-primary" :activities="document.activities"/>

            <span class="has-text-primary">
                <icon-geometry-detail v-if="document.geometry.has_geom_detail" />                
                <icon-document type="image" v-if="document.img_count != 0"/>
            </span>

            {{document.date_start}}
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

        props: ['document'],

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
