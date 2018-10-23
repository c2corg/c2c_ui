<template>
    <modal-window ref="modalWindow" class="associations-editor">
        <div slot="header" class="has-text-centered">
            <span v-translate>
                Edit associations
            </span>
        </div>
        <div class="columns is-multiline">

            <div class="column is-12">
                <input v-model="searchText" >
            </div>

            <div class="column is-6" v-if="validAssociations.waypoint!==undefined">
                <div class="title is-2" v-translate>
                    Waypoints
                </div>
                <div v-for="(waypoint, id) of document.associations.waypoints" :key="id">
                    <pretty-waypoint-link :waypoint="waypoint"/>
                    <delete-button @click="remove(waypoint)" class="is-pulled-right"/>
                </div>

                <div v-for="(waypoint, id) of availableWaypoints.documents" :key="id + '_new'">
                    <pretty-waypoint-link :waypoint="waypoint"/>
                    <add-button @click="add(waypoint)" class="is-pulled-right"/>
                </div>

            </div>

            <div class="column is-6" v-if="validAssociations.waypoint!==undefined">
                <div class="title is-2" v-translate>
                    Books
                </div>
                <div v-for="(book, id) of document.associations.books" :key="id">
                    <pretty-book-link :book="book"/>
                    <delete-button @click="remove(book)" class="is-pulled-right"/>
                </div>

                <div v-for="(book, id) of availableBooks.documents" :key="id + '_new'">
                    <pretty-book-link :book="book"/>
                    <add-button @click="add(book)" class="is-pulled-right"/>
                </div>

            </div>

            <div class="column is-6" v-if="validAssociations.route!==undefined">
                <div class="title is-2" v-translate>
                    Routes
                </div>
                <div v-for="(route, id) of document.associations.routes" :key="id">
                    <pretty-route-link :route="route"/>
                    <delete-button @click="remove(route)" class="is-pulled-right"/>
                </div>
                <div v-for="(route, id) of availableRoutes.documents" :key="id + '_new'">
                    <pretty-route-link :route="route"/>
                    <add-button @click="add(route)" class="is-pulled-right"/>
                </div>
            </div>

            <div class="column is-6" v-if="validAssociations.article!==undefined">
                <div class="title is-2" v-translate>
                    Articles
                </div>
                <div v-for="(article, id) of document.associations.articles" :key="id">
                    <document-link :document="article" />
                    <delete-button @click="remove(article)" class="is-pulled-right"/>
                </div>
                <div v-for="(article, id) of availableArticles.documents" :key="id + '_new'">
                    <document-link :document="article" />
                    <add-button @click="add(article)" class="is-pulled-right"/>
                </div>
            </div>

            <div class="column is-6" v-if="validAssociations.xreport!==undefined">
                <div class="title is-2" v-translate>
                    Xreport
                </div>
                <div v-for="(xreport, id) of document.associations.xreports" :key="id">
                    <document-link :document="xreport"/>
                    <delete-button @click="remove(xreport)" class="is-pulled-right"/>
                </div>
                <div v-for="(xreport, id) of availableXreports.documents" :key="id + '_new'">
                    <document-link :document="xreport"/>
                    <add-button @click="add(xreport)" class="is-pulled-right"/>
                </div>
            </div>

            <div class="column is-6" v-if="validAssociations.outing!==undefined">
                <div class="title is-2" v-translate>
                    Outings
                </div>
                <div v-for="(outing, id) of document.associations.outings" :key="id">
                    <pretty-outing-link :outing="outing"/>
                    <delete-button @click="remove(outing)" class="is-pulled-right"/>
                </div>
                <div v-for="(outing, id) of availableOutings.documents" :key="id + '_new'">
                    <pretty-outing-link :outing="outing"/>
                    <add-button @click="add(outing)" class="is-pulled-right"/>
                </div>
            </div>

        </div>
    </modal-window>
</template>

<script>
    import c2c from '@/js/c2c'
    import constants from '@/js/constants'
    import { requireDocumentProperty } from '@/js/propertiesMixins'

    export default {

        mixins : [ requireDocumentProperty ],

        data(){
            return {
                searchText:"",
                promise:null,
            }
        },

        computed:{
            validAssociations(){
                return constants.objectDefinitions[this.documentType].validAssociations
            },

            availableWaypoints(){
                return this.filterProposition_("waypoints")
            },
            availableArticles(){
                return this.filterProposition_("articles")
            },
            availableBooks(){
                return this.filterProposition_("books")
            },
            availableRoutes(){
                return this.filterProposition_("routes")
            },
            availableXreports(){
                return this.filterProposition_("xreports")
            },
            availableOutings(){
                return this.filterProposition_("outings")
            },
        },

        watch:{
            searchText:'search'
        },

        methods:{
            search(){
                if(this.searchText.length<3)
                    return

                this.promise = c2c.search({limit:5, q:this.searchText})
            },

            filterProposition_(type){
                if(!this.promise || !this.promise.data || !this.promise.data[type])
                    return {
                        total:0,
                        documents:[]
                    }

                return this.promise.data[type]
            },

            show(){
                this.$refs.modalWindow.show()
            },
            add(child){
                c2c.association.create(this.document, child).then(() => {
                    // TODO add feedback and handle error
                })
            },
            remove(child){
                c2c.association.remove(this.document, child).then(() => {
                    // TODO add feedback and handle error
                })
            },
        }
    }

</script>

<style scoped lang="scss">

.associations-editor{

    .modal-content{
        width:95%;
        height:95%;
        padding:2%;
    }
}
</style>
