<template>
    <card-container class="route-card" @click="go">
        <document-title slot="header" :document="document"/>

        <div slot="row1" class="is-ellipsed">
            <card-region-item :document="document" class="is-ellipsed"/>
        </div>

        <div slot="row3" class="level">
            <card-elevation-item :elevation="document.elevation"/>

            <span v-if="document.slackline_types">
                <fa-icon icon="bomb"/>
                {{ document.slackline_types }}
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
