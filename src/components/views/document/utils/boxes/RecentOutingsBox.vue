<template>
    <content-box class="no-print">
        <div class="title is-2">
            <span v-translate>Last outings</span>
            <add-link
                v-if="addQuery && document.associations.recent_outings.documents.length!=0"
                document-type="outing"
                :query="addQuery"
                class="button is-small is-rounded is-primary"/>
        </div>

        <div v-if="document.associations.recent_outings.documents.length==0">
            <!-- TODO center -->
            <add-link
                v-if="addQuery"
                document-type="outing"
                :query="addQuery"
                class="button is-primary">
                Add the first outing
            </add-link>
        </div>

        <div v-for="(outing, i) of outings" :key="i">
            <pretty-outing-link :outing="outing"/>
        </div>
    </content-box>
</template>

<script>
    import { requireDocumentProperty } from '@/js/propertiesMixins.js'

    export default {
        mixins : [ requireDocumentProperty ],

        props: {
            addQuery: {
                type:Object,
                default:undefined,
            }
        },

        computed:{
            // API bug, an outing can be present several times
            outings(){
                const result = new Map()

                for(let outing of this.document.associations.recent_outings.documents)
                    result.set(outing.document_id, outing)

                return [...result.values()]
            }
        }
    }
</script>
