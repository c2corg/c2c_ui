<template>
    <div class="columns content section" v-if="results">
        <div class="column">
            <h1>routes ({{results.routes.total}})</h1>
            <route-link v-for="route of results.routes.documents" :key="route.document_id" :route="route"/>
        </div>
        <div class="column">
            <h1>waypoints ({{results.waypoints.total}})</h1>
            <div v-for="waypoint of results.waypoints.documents" :key="waypoint.document_id" >
                <document-link :document="waypoint"/>
            </div>
        </div>
    </div>
</template>

<script>
    import c2c from '@/js/c2c.js'

    import RouteLink from '@/components/views/document/utils/RouteLink'
    import DocumentLink from '@/components/utils/DocumentLink'

    export default{
        components:{
            RouteLink,
            DocumentLink
        },

        data(){
            return {
                results:null
            }
        },

        created(){
            c2c.search(this.$route.query).then(response => {
                this.results = response.data
            })
        }

    }

</script>
