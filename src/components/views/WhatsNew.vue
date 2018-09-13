<template>
    <div class="section content">
        <div v-if="results">
            <router-link :to="{name: 'whatsnew', query: getNextQuery() }" class="button is-link">
                next
            </router-link>
            <table>
                <tr>
                    <th>modified the</th>
                    <th>author</th>
                    <th>links</th>
                    <th/>
                    <th>
                        <span>title</span>
                        :
                        <span>comment</span>
                    </th>
                </tr>
                <tr v-for="(change, index) of results.feed" :key="index">
                    <td>
                        <version-link :type="change.document.type" :id="change.document.document_id"
                                      :version="change.version_id" :lang="change.lang">
                            {{change.written_at | moment('YYYY-MM-DD hh:mm:ss') }}
                        </version-link>
                    </td>
                    <td>
                        <contributor-link :contributor="change.user"/>
                    </td>
                    <td>
                        <document-link :document="change.document" :lang="change.lang">
                            last
                        </document-link>

                        <diff-link :type="change.document.type"
                                   :id="change.document.document_id" :lang="change.lang"
                                   :version-to="change.version_id"/>

                        <history-link :type="change.document.type"
                                      :id="change.document.document_id" :lang="change.lang"/>

                    </td>
                    <td>
                        <icon-quality :quality="change.document.quality"/>
                        {{change.lang}}
                    </td>
                    <td>
                        <icon-document :type="change.document.type"/>
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

    export default {

        data(){
            return {
                results:null,
            }
        },

        created(){
            c2c.getRecentChanges(this.$route.query).then(response => {
                this.results = response.data
            })
        },

        methods:{
            getNextQuery(){
                return Object.assign({}, this.$route.query, {token:this.results.pagination_token})
            }
        },
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
