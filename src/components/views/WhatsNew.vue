<template>
    <div class="section content">
        <div v-if="results">
            <router-link class="button is-link" :to="{name: 'whatsnew', query: getNextQuery() }">
                next
            </router-link>
            <table>
                <tr>
                    <th>modified the</th>
                    <th>author</th>
                    <th>links</th>
                    <th></th>
                    <th>
                        <span>title</span>
                        :
                        <span>comment</span>
                    </th>
                </tr>
                <tr v-for='(change, index) of results.feed' :key="index">
                    <td>
                        <router-link :to="{name:documentType[change.document.type] + '-version', params:{id:change.document.documentId, version:change.version_id, change:change.lang}}">
                            {{change.written_at | moment('YYYY-MM-DD hh:mm:ss') }}
                        </router-link>
                    </td>
                    <td>
                        <contributor-link :contributor="change.user"/>
                    </td>
                    <td>
                        <router-link :to="{name: documentType[change.document.type], params: {id:change.document.document_id} }">
                            last
                        </router-link>
                        <router-link :to="{name: 'diff', params: {type: documentType[change.document.type],
                                                                  id:change.document.document_id,
                                                                  versionFrom: 'prev',
                                                                  versionTo: change.version_id,
                                                                  lang: change.lang} }">
                            diff
                        </router-link>
                        <router-link :to="{name: 'history', params: {type:documentType[change.document.type] , id:change.document.document_id, lang:change.lang} }">
                            hist
                        </router-link>
                    </td>
                    <td>
                        <icon-quality :quality="change.document.quality"/>
                        {{change.lang}}
                    </td>
                    <td>
                        <icon-document :type="documentType[change.document.type]"/>
                        {{change.document.title}}
                        :
                        <span v-if="change.comment">
                            {{change.comment}}
                        </span>
                        <span v-else>
                            empty comment
                        </span>
                    </td>
                </tr>
            </table>
        </div>
    </div>
</template>
<script>
    import c2c from '@/js/c2c.js'

    import ContributorLink from '@/components/utils/ContributorLink'

    export default {
        components:{
            ContributorLink,
        },

        data(){
            return {
                documentType:c2c.documentType,
                results:null,

            }
        },

        methods:{
            getNextQuery(){
                return Object.assign({}, this.$route.query, {token:this.results.pagination_token})
            }
        },

        created(){
            c2c.getRecentChanges(this.$route.query).then(response => {
                this.results = response.data
            })
        }
    }
</script>
<style scoped>

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
