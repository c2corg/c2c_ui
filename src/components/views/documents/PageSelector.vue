<template>
    <div class="page-selector has-text-centered">
        <div>
            <router-link v-if="currentPage!=1"
                :to="pageQuery(currentPage-1)">
                <base-icon iconClass="fas fa-chevron-left"/>
            </router-link>

            <router-link v-for="page of pageLinks" :key="page" v-if="page < pageCount"
                :to="pageQuery(page)">
                {{page}}
            </router-link>

            <span v-if="pageLinks[2]+1<pageCount" >
                ...
            </span>

            <router-link v-if="pageLinks[2]<pageCount"
                :to="pageQuery(pageLinks[2])">
                {{pageCount}}
            </router-link>

            <router-link v-if="currentPage<pageCount"
                :to="pageQuery(currentPage+1)">
                <base-icon iconClass="fas fa-chevron-right"/>
            </router-link>
        </div>
        <div>
            {{offset + 1}}-{{offset + documents.documents.length}} / {{documents.total}}
        </div>
    </div>
</template>

<script>

    const queryLimit = 30

    export default {
        props:["documents"],

        data(){
            return {queryLimit}
        },

        computed:{
            offset(){
                return parseInt(this.$route.query.offset || 0)
            },
            pageCount(){
                return Math.min(Math.floor(this.documents.total / queryLimit) + 1, 99)
            },
            currentPage(){
                return Math.floor(this.offset / queryLimit) + 1
            },
            pageLinks(){
                var start = Math.max(this.currentPage-1, 1)
                return [start, start+1, start+2]
            },
        },

        methods:{

            pageQuery(page){
                var query = Object.assign({}, this.$route.query)
                query.offset = (page-1) * queryLimit
                return {name : this.$route.name, params : this.$route.params, query}
            }
        }
    }

</script>
