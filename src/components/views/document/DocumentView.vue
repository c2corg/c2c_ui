
<template>
    <div class="section content"  v-if="document">

        <div class="notification is-warning" v-if="isVersionView">
            This is an archived version of this page, as of {{version.written_at | moment("YYYY-MM-DD hh:mm:ss") }}

            <br>

            <span v-if="previousVersionId">
                (<diff-link :type="type" :id="$route.params.id" :lang="$route.params.lang"
                            :version-from="previousVersionId"
                            :version-to="$route.params.version"/>)
                <version-link :type="type" :id="$route.params.id" :lang="$route.params.lang" :version="previousVersionId">
                    ← previous version
                </version-link>
            </span>
            <span v-else>this is the first version</span>
            |
            <document-link :document="document" :lang="$route.params.lang">
                see actual version
            </document-link>
            (<diff-link :type="type" :id="$route.params.id" :lang="$route.params.lang"
                        :version-from="$route.params.version"
                        version-to="last"/>)
            |
            <span v-if="nextVersionId">
                <version-link :type="type" :id="$route.params.id" :lang="$route.params.lang" :version="nextVersionId">
                    next version →
                </version-link>
                (<diff-link :type="type" :id="$route.params.id" :lang="$route.params.lang"
                            :version-to="nextVersionId"
                            :version-from="$route.params.version"/>)
            </span>
            <span v-else>this is the last version</span>

            <br>
            <icon-document type="profile"/>
            <contributor-link :contributor="version"/> : <em>{{version.comment}}</em>
        </div>

        <h1>
            <icon-document :type="type"/>
            <document-title :document="document"/>
            <span class="is-pulled-right">
                <history-link :type="type" :id="document.document_id" :lang="locale.lang">
                    <icon-history class="is-medium" />
                </history-link>
                <edit-link :type="type" :id="document.document_id" :lang="locale.lang">
                    <icon-edit class="is-medium"/>
                </edit-link>
            </span>
        </h1>

        <component :is="type + '-content'" :document="document"
                   :locale="locale" :object-definition="constants.objectDefinitions[this.type]">
        </component>

        <document-comments :document="document" :locale="locale" />
    </div>

</template>

<script>
    import c2c from '@/js/c2c.js'
    import user from '@/js/user.js'
    import constants from '@/js/constants.js'


    import RouteContent from './content/RouteContent'
    import OutingContent from './content/OutingContent'
    import ProfileContent from './content/ProfileContent'
    import ArticleContent from './content/ArticleContent'
    import BookContent from './content/BookContent'
    import AreaContent from './content/AreaContent'
    import ImageContent from './content/ImageContent'
    import WaypointContent from './content/WaypointContent'
    import XreportContent from './content/XreportContent'

    import DocumentComments from './utils/DocumentComments'

    export default {
        components:{
            RouteContent,
            OutingContent,
            ProfileContent,
            ArticleContent,
            BookContent,
            AreaContent,
            ImageContent,
            WaypointContent,
            XreportContent,
            DocumentComments,
        },

        data() {
            return {
                isVersionView:this.$route.name.endsWith("-version"),
                type:constants.getDocumentType(this.$route.name.split("-")[0]),
                document: null,
                locale: null,
                version: null,
                previousVersionId: null,
                nextVersionId: null,
                constants:constants,
            }
        },

        created() {

            if(this.isVersionView){
                c2c[this.type].getVersion(this.$route.params.id,this.$route.params.lang,this.$route.params.version).then(response => {
                    this.document = response.data.document
                    //versionned datas are poor...
                    this.document.areas = []
                    this.document.creator = null
                    this.document.associations = {
                        images:[],
                        books:[],
                        users:[],
                        waypoints:[],
                        waypoint_children:[],
                        all_routes:{
                            documents:[],
                        },
                        recent_outings:{
                            documents:[],
                        }
                    }

                    this.locale = user.getLocaleStupid(this.document, this.$route.params.lang)
                    this.version = response.data.version
                    this.nextVersionId = response.data.next_version_id
                    this.previousVersionId = response.data.previous_version_id
                })
            } else {

                c2c[this.type].get(this.$route.params.id).then(response => {
                    this.document=response.data
                    this.locale = user.getLocaleSmart(this.document, this.$route.params.lang)
                });
            }
        }
    }

</script>
