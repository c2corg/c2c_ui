
import { requireDocumentProperty } from '@/js/propertiesMixins.js'

import CardContainer from './CardContainer'
import CardRegionItem from './CardRegionItem'
import CardElevationItem from './CardElevationItem'
import CardActivitiesItem from './CardActivitiesItem'

export default {

    components: {
        CardContainer,
        CardRegionItem,
        CardElevationItem,
        CardActivitiesItem,
    },

    mixins : [ requireDocumentProperty ] ,

    methods:{
        go(){
            this.$router.push({
                name: this.documentType,
                params: { id: this.document.document_id }
            })
        }
    },
}
