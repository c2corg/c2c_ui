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

        <div v-for="(outing, i) of outings" :key="i">
            <pretty-outing-link :outing="outing"/>
        </div>

        <div v-if="addQuery" class="has-text-centered">
            <add-link
                v-if="document.associations.recent_outings.documents.length==0"
                document-type="outing"
                :query="addQuery"
                class="button is-primary">
                Add the first outing
            </add-link>
            <router-link
                v-else-if="document.associations.recent_outings.documents.length!=0"
                class="button is-primary"
                :to="{ name: 'outings', query: addQuery }"
                v-translate>
                show all
            </router-link>
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
