<template>
    <div v-if="results" class="columns content section">
        <html-header title="Search"/>
        <div class="column">
            <h1>
                <span v-translate>Routes</span>
                ({{ results.routes.total }})
            </h1>
            <div v-for="route of results.routes.documents" :key="route.document_id" >            
                <pretty-route-link :route="route"/>
            </div>
        </div>
        <div class="column">
            <h1>
                <span v-translate>Waypoints</span>
                ({{ results.waypoints.total }})
            </h1>
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
                promise:null
            }
        },

        computed:{
            results(){
                return this.promise.data
            }
        },

        watch:{
            $route: {
                handler: 'search',
                immediate: true, // fire event at the creation
            },
        },

        methods:{
            search(){
                var query = Object.assign({limit:20}, this.$route.query)
                this.promise = c2c.search(query)
            }
        }
    }

</script>
