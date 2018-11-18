<template>
    <div class="box no-print">
        <div class="title is-2">
            <span v-translate>Last outings</span>

            <add-link
                v-if="documentType=='route' && document.associations.recent_outings.documents.length!=0"
                document-type="outing"
                :query="query"
                class="button is-small is-rounded is-primary"/>

            <router-link :to="{name:'outings', query:query}" class="button is-small is-rounded is-primary">
                List
            </router-link>

        </div>

        <div v-for="(outing, i) of outings" :key="i">
            <pretty-outing-link :outing="outing"/>
        </div>

        <div v-if="documentType=='route'" class="has-text-centered">
            <add-link
                v-if="document.associations.recent_outings.documents.length==0"
                document-type="outing"
                :query="query"
                class="button is-primary">
                Add the first outing
            </add-link>
            <router-link
                v-else-if="document.associations.recent_outings.documents.length!=0"
                class="button is-primary"
                :to="{ name: 'outings', query: query }"
                v-translate>
                show all
            </router-link>
        </div>

    </div>
</template>

<script>
    import { requireDocumentProperty } from '@/js/properties-mixins'

    export default {
        mixins : [ requireDocumentProperty ],

        computed:{
            // API bug, an outing can be present several times
            outings(){
                const result = new Map()

                for(let outing of this.document.associations.recent_outings.documents)
                    result.set(outing.document_id, outing)

                return [...result.values()]
            },

            query(){
                const query = {}
                query[this.document.type] = this.document.document_id
                return query
            },
        }
    }
</script>

<style scoped>
    .button{
        vertical-align: bottom;
        margin-left: 1rem;
    }
</style>
