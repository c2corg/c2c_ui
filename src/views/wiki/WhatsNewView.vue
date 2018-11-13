<template>
    <div class="section content">
        <html-header title="Recents changes"/>

        <table>
            <tr>
                <th v-translate>Modified the</th>
                <th v-translate>Author</th>
                <th v-translate>Links</th>
                <th/>
                <th>
                    <span v-translate>title</span>
                    :
                    <span v-translate>comment</span>
                </th>
            </tr>
            <tr v-for="(change, index) of feed" :key="index">
                <td>
                    <version-link
                        :document-type="change.document.documentType"
                        :id="change.document.document_id"
                        :version="change.version_id"
                        :lang="change.lang">
                        {{ change.written_at | moment('YYYY-MM-DD hh:mm:ss') }}
                    </version-link>
                </td>
                <td>
                    <contributor-link :contributor="change.user"/>
                </td>
                <td>
                    <document-link :document="change.document" :lang="change.lang">
                        last
                    </document-link>

                    <diff-link :document-type="change.document.documentType"
                               :id="change.document.document_id"
                               :lang="change.lang"
                               version-from="prev"
                               :version-to="change.version_id"/>

                    <history-link :document="change.document" :lang="change.lang"/>

                </td>
                <td>
                    <icon-quality :quality="change.document.quality"/>
                    {{ change.lang }}
                </td>
                <td>
                    <icon-document :document-type="change.document.documentType"/>
                    {{ change.document.title }}
                    :
                    <span v-if="change.comment">
                        {{ change.comment }}
                    </span>
                    <span v-else v-translate>
                        empty comment
                    </span>
                </td>
            </tr>
        </table>

        <loading-notification :promise="promise" />

    </div>
</template>
<script>
    import c2c from '@/apis/c2c'

    export default {

        data(){
            return {
                promise:{},
                feed:[],
                endOfFeed:false,
            }
        },

        computed: {
            nextQuery(){
                if(!this.promise.data)
                    return this.$route.query

                return Object.assign({}, this.$route.query, {token:this.promise.data.pagination_token})
            }
        },

        watch:{
            "$route":{
                handler:"initialize",
                immediate:true,
            }
        },

        mounted() {
          window.addEventListener("scroll", this.onScroll)
        },

        beforeDestroy(){
            window.removeEventListener("scroll", this.onScroll)
        },

        methods:{
            initialize(){
                this.feed = []
                this.endOfFeed = false
                this.load()
            },

            load(){
                if(this.promise && this.promise.loading)
                    return

                if(this.endOfFeed)
                    return

                this.promise = c2c.getRecentChanges(this.nextQuery).then(this.onLoad)
            },

            onLoad(){

                for(let change of this.promise.data.feed){
                    change.document.documentType = this.$documentUtils.getDocumentType(change.document.type)
                    this.feed.push(change)
                }

                this.endOfFeed = this.promise.data.feed.length == 0
            },

            onScroll(){
                if(document.documentElement.scrollTop + window.innerHeight === document.documentElement.offsetHeight)
                    this.load()
            },
        },
    }
</script>

<style scoped lang="scss">

    td{
        white-space:nowrap;
    }

    td:last-child {
        width: 100%;
        white-space:normal;
    }

    td:last-child > span:last-child, th:last-child > span:last-child{
        font-style:italic;
    }

</style>
