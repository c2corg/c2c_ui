<template>
    <div class="section content">
        <html-header title="Recents changes"/>
        <div v-if="promise.data">
            <router-link
                :to="{name: 'whatsnew', query: getNextQuery() }"
                class="button is-link"
                v-translate>
                Next
            </router-link>
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
                <tr v-for="(change, index) of promise.data.feed" :key="index">
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

                        <history-link :document-type="change.document.documentType"
                                      :id="change.document.document_id"
                                      :lang="change.lang"/>

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
        </div>
    </div>
</template>
<script>
    import c2c from '@/apis/c2c'
    import constants from '@/js/constants'

    export default {

        data(){
            return {
                promise:null,
            }
        },

        created(){
            this.promise = c2c.getRecentChanges(this.$route.query)
            .then(() => {

                for(let change of this.promise.data.feed)
                    change.document.documentType = constants.getDocumentType(change.document.type)
            })
        },

        methods:{
            getNextQuery(){
                return Object.assign({}, this.$route.query, {token:this.promise.data.pagination_token})
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
