<template>
    <div v-if="results" class="columns content section">
        <html-header title="Search"/>
        <div class="column">
            <h2>
                <span v-translate>Routes</span>
                ({{ results.routes.total }})
            </h2>
            <div v-for="route of results.routes.documents" :key="route.document_id" >
                <pretty-route-link :route="route"/>
            </div>
        </div>
        <div class="column">
            <h2>
                <span v-translate>Waypoints</span>
                ({{ results.waypoints.total }})
            </h2>
            <div v-for="waypoint of results.waypoints.documents" :key="waypoint.document_id" >
                <pretty-waypoint-link :waypoint="waypoint"/>
            </div>
        </div>
    </div>
</template>

<script>
    import c2c from '@/apis/c2c'

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
