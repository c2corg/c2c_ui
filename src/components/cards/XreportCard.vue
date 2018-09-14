<template>
    <card-container class="route-card" @click="go">
        <document-title slot="header" :document="document"/>

        <div slot="row1" class="level">
            <card-region-item :document="document" />

            <card-elevation-item :elevation="document.elevation"/>
        </div>

        <div slot="row2" class="level">
            <span class="is-ellipsed">
                {{ document.event_type.join(", ") }}
            </span>

            <span class="is-nowrap">
                {{ document.date }}
            </span>
        </div>

        <div slot="row3" class="level">
            <activities :activities="document.activities"/>
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
            CardRegionItem
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
