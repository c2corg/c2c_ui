<template>
    <div class="box" v-if="source.length !=0 || !hideButtons">
        <h2 class="title is-2">
            <span v-translate>Routes</span>
            <add-link
                v-if="!hideButtons"
                document-type="route"
                :query="query"
                class="button is-small is-rounded is-primary"/>

            <router-link
                v-if="!hideButtons"
                :to="{name:'routes', query:query}"
                class="button is-small is-rounded is-primary">
                List
            </router-link>
        </h2>
        <div v-for="activity of Object.keys(routes)" :key="activity">
            <h3 class="title is-3">
                <icon-activity :activity="activity" />
                {{ $gettext(activity) }}
            </h3>
            <div v-for="(route, i) of Object.values(routes[activity])" :key="i">
                <document-link :document="route" />,
                <route-rating :document="route"/>
            </div>
        </div>

    </div>
</template>

<script>
    import { requireDocumentProperty } from '@/js/properties-mixins'

    export default {
        mixins : [ requireDocumentProperty ],

        props : {
            hideButtons:{
                type:Boolean,
                default:false,
            }
        },

        data(){
            return {
                routes : {},
            }
        },

        computed:{
            query(){
                const query = {}
                query[this.document.type] = this.document.document_id
                return query
            },

            source(){
                return this.document.associations.routes || this.document.associations.all_routes.documents
            },
        },

        created(){

            for(let route of this.source){
                for(let activity of route.activities){
                    if(!this.routes[activity])
                        this.routes[activity] = {}

                    this.routes[activity][route.document_id] = route
                }
            }
        }
    }
</script>

<style scoped>
    h2{
        margin-bottom:

    }
    h3{
        margin-top:1.5rem!important;
        margin-bottom: 0.5rem!important;
    }

    .button{
        vertical-align: bottom;
        margin-left: 1rem;
    }
</style>
