<template>
    <div class="section content">
        <div v-if="results">
            <router-link :to="{name: 'whatsnew', query: {token:results.pagination_token} }">next</router-link>
            <table>
                <tr v-for='(change, index) of results.feed' :key="index">
                    <td>{{formatDate(change.written_at)}}</td>
                    <td>
                        <contributor-link :contributor="change.user"/>
                    </td>
                    <td>
                        <router-link :to="{name: documentType[change.document.type], params: {id:change.document.document_id} }">
                            last
                        </router-link>
                        diff
                        <router-link :to="{name: 'history', params: {type:documentType[change.document.type] , id:change.document.document_id, lang:change.lang} }">
                            hist
                        </router-link>
                    </td>
                    <td>{{change.lang}}</td>
                    <td>
                        <icon-quality :quality="change.document.quality"/>
                    </td>
                    <td>
                        <icon-document :type="documentType[change.document.type]"/>
                        {{change.document.title}}
                        {{change.comment}}
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
                formatDate(source){
                    var d = new Date(source)

                    return d.getDate() + "/" + (d.getMonth()+1) + " " + d.getHours() + ":" + d.getMinutes() + ":" + d.getSeconds()
                },

                getQueryNext(){
                    this.$route.query["token"] = this.results.pagination_token
                    return this.$route.query
                }
            }
        },

        created(){
            c2c.getRecentChanges(this.$route.query).then(response => {
                this.results = response.data
            })
        }
    }
</script>
