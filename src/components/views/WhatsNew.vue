<template>
    <div class="section content">
        <div v-if="results">
            <router-link :to="{name: 'whatsnew', query: {token:results.pagination_token} }">next</router-link>
            <table>
                <tr v-for='(change, index) of results.feed' :key="index">
                    <td>{{formatDate(change.written_at)}}</td>
                    <td>
                        <author-link :author="change.user"/>
                        (<router-link :to="{name: 'whatsnew', query: {u:change.user.user_id} }">c</router-link>)
                    </td>
                    <td>
                        <router-link :to="{name: documentType[change.document.type], params: {id:change.document.document_id} }">last</router-link>
                        diff
                        hist
                    </td>
                    <td>{{change.lang}}</td>
                    <td>
                        <quality-icon :quality="change.document.quality"/>
                    </td>
                    <td>
                        {{documentType[change.document.type]}}:{{change.document.title}}
                        {{change.comment}}
                    </td>
                </tr>
            </table>
        </div>
    </div>
</template>
<script>
    import c2c from '@/js/c2c.js'

    import AuthorLink from '@/components/views/document/utils/AuthorLink'
    import QualityIcon from '@/components/utils/QualityIcon'

    export default {
        components:{
            AuthorLink,
            QualityIcon
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
                    console.log(this.$route.query)
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
