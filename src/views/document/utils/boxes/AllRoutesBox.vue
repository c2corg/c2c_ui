<template>
    <content-box v-if="document.associations.all_routes.documents.length">
        <!-- TODO : add route button -->
        <h2 class="title is-2">
            <span v-translate>
                Routes
            </span>
            <add-link
                document-type="route"
                :query="{w:document.document_id}"
                class="button is-small is-rounded is-primary"/>
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

    </content-box>
</template>

<script>
    import { requireDocumentProperty } from '@/js/propertiesMixins.js'

    export default {
        mixins : [ requireDocumentProperty ],

        data(){
            return {
                routes : {},
            }
        },

        created(){
            for(let route of this.document.associations.all_routes.documents){
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
</style>
