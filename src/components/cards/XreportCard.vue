<template>
    <card-container class="route-card" @click="go">
        <document-title slot="header" :document="document"/>

        <div slot="row1" class="is-ellipsed">
            <card-region-item :document="document" class="is-ellipsed"/>
            <span>{{document.event_type}}</span>
        </div>

        <div slot="row2" class="level">
            <span v-if="document.elevation">
                <fa-icon icon="bomb"/>
                {{document.elevation}}&nbsp;m
            </span>
            <span>
                {{document.date}}
            </span>
        </div>

        <div slot="row3" class="level">
            <activities :activities="document.activities"/>
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
