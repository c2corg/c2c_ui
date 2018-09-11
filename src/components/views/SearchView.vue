<template>
    <div class="columns content section" v-if="results">
        <div class="column">
            <h1>routes ({{results.routes.total}})</h1>
            <pretty-route-link v-for="route of results.routes.documents" :key="route.document_id" :route="route"/>
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

    export default{

        data(){
            return {
                results:null
            }
        },

        created(){
            this.search()
        },

        watch:{
            $route(){
                this.search();
            }
        },

        methods:{
            search(){
                var query = Object.assign({limit:100}, this.$route.query)
                c2c.search(query).then(response => {
                    this.results = response.data
                })
            }
        }
    }

</script>
