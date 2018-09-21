<template>
    <div>
        <nav class="pagination is-rounded is-centered" role="navigation" aria-label="pagination">
            <router-link
                :disabled="currentPage<=1"
                :to="pageQuery(currentPage-1)"
                class="pagination-previous">
                <fa-icon icon="chevron-left"/>
            </router-link>

            <router-link
                :disabled="currentPage>=pageCount"
                :to="pageQuery(currentPage+1)"
                class="pagination-next">
                <fa-icon icon="chevron-right"/>
            </router-link >

            <ul class="pagination-list">
                <li v-for="page of pageLinks" :key="page">
                    <span v-if="page===null" class="pagination-ellipsis">&hellip;</span>
                    <router-link
                        v-else :class="{'is-current':page==currentPage}"
                        :aria-label="'Goto page' + page"
                        :to="pageQuery(page)"
                        class="pagination-link">
                        {{ page }}
                    </router-link>
                </li>
            </ul>
        </nav>

        <div class="has-text-centered">
            {{ offset + 1 }}-{{ offset + documents.documents.length }} / {{ documents.total }}
        </div>
    </div>
</template>

<script>

    const queryLimit = 30

    export default {
        props:{
            documents: {
                type: Object,
                required: true,
            },
        },

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

                // Less than 8 pages :
                //    (1) (2) (3) (4)

                // if current page is less than 5 :
                //    (1) (2) (3) (4) (5) ... (Z)

                // if current page is more than pageCount -4 :
                //    (1) ... (V) (W) (X) (Y) (Z)

                // else
                //    (1) ... (K) (L) (M) ... (Z)

                if(this.pageCount < 8){
                    let result = []

                    for(let i=1;i<=this.pageCount;i++)
                        result.push(i)

                    return result

                } else if(this.currentPage < 5) {
                    return [1,2,3,4,5,null,this.pageCount]
                } else if(this.currentPage > this.pageCount-4) {
                    return [1,null,this.pageCount-4,this.pageCount-3,this.pageCount-2,this.pageCount-1,this.pageCount]
                } else {
                    return [1, null, this.currentPage-1, this.currentPage, this.currentPage+1, null, this.pageCount]
                }
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

<style scoped lang="scss">

@import '@/assets/sass/variables.scss';

.pagination-link, .pagination-next, .pagination-previous{
    background:$white-bis;
}

</style>
