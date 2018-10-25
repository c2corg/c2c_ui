<template>
    <div class="section content">
        <!-- TODO : translate -->
        <html-header title="Differences between versions"/>
        <h1>
            <icon-document :document-type="documentType" class="is-large"/>
            <span>diff</span> ({{ lang }}) :
            <router-link :to="{ name: documentType, params: {id:documentId, lang:lang} }">{{ title }}</router-link>
        </h1>
        <div class="columns">
            <div v-if="oldVersion" class="column">
                <div>
                    <version-link
                        :document-type="documentType"
                        :id="documentId"
                        :version="oldVersion.version.version_id"
                        :lang="lang">
                        Revision #{{ oldVersion.document.version }} as of {{ oldVersion.version.written_at | moment('YYYY-MM-DD hh:mm:ss') }}
                    </version-link>
                </div>
                <div>
                    by <contributor-link :contributor="oldVersion.version"/>
                </div>
                <div>
                    {{ oldVersion.version.comment }}
                </div>
                <div>
                    <diff-link v-if="oldVersion.previous_version_id"
                               :document-type="documentType"
                               :id="documentId"
                               :lang="lang"
                               :version-from="oldVersion.previous_version_id"
                               :version-to="oldVersion.version.version_id">
                        ← previous difference
                    </diff-link>
                    <span v-else>
                        this is the first version
                    </span>
                </div>
            </div>

            <div v-if="newVersion" class="column">
                <div>
                    <version-link
                        :document-type="documentType"
                        :id="documentId"
                        :version="newVersion.version.version_id"
                        :lang="lang">
                        Revision #{{ newVersion.document.version }} as of {{ newVersion.version.written_at | moment('YYYY-MM-DD hh:mm:ss') }}
                    </version-link>
                </div>
                <div>
                    by <contributor-link :contributor="newVersion.version"/>
                </div>
                <div>
                    {{ newVersion.version.comment }}
                </div>
                <div>
                    <diff-link v-if="newVersion.next_version_id"
                               :document-type="documentType"
                               :id="documentId"
                               :lang="lang"
                               :version-from="newVersion.version.version_id"
                               :version-to="newVersion.next_version_id">
                        next difference →
                    </diff-link>
                    <span v-else>
                        this is the last version
                    </span>
                </div>
            </div>
        </div>

        <div v-if="oldVersion && newVersion">
            <div v-if="geoLocalized && oldVersion.document.geometry.geom !== newVersion.document.geometry.geom ">
                <map-view :old-document="oldVersion.document" :new-document="newVersion.document" />
            </div>

            <div v-for="key of Object.keys(diffProperties)" :key="key">
                <h2 class="title is-2">{{ key }}</h2>
                <div class="columns">
                    <div class="column is-6">
                        <del>{{ diffProperties[key].old }}</del>
                    </div>
                    <div class="column is-6">
                        <ins>{{ diffProperties[key].new }}</ins>
                    </div>
                </div>
            </div>

            <div v-for="key of Object.keys(diffLocales)" :key="key">
                <h2 class="title is-2">{{ key }}</h2>
                <div class="locale-diff">
                    <div>
                        <pre>
                            <!-- eslint-disable-next-line vue/no-v-html -->
                            <code v-html="diffLocales[key]"/>
                        </pre>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import c2c from '@/apis/c2c'
    import constants from '@/js/constants'

    import { diff_match_patch } from '@/libs/diff_match_patch_uncompressed'

    export default {

        data() {
            return {
                title: undefined,
                oldVersion:null,
                newVersion:null,
                diffProperties:{},
                diffLocales:{}
            }
        },

        computed: {
            documentId(){ return parseInt(this.$route.params.id) },
            lang(){ return this.$route.params.lang },
            documentType(){ return this.$route.name.replace("-diff","") },

            geoLocalized() {
                return constants.objectDefinitions[this.documentType].geoLocalized
            }
        },

        watch:{
            '$route':'loadVersions'
        },

        created() {
            this.loadVersions()
        },

        methods: {
            loadVersions(){
                this.loadVersionSmart(this.$route.params.versionFrom, "oldVersion", this.$route.params.versionTo)
                this.loadVersion(this.$route.params.versionTo, "newVersion")
            },

            getKeys(obj1, obj2, excludedKeys){

                var keys = Object.keys(obj1).concat( Object.keys(obj2))

                excludedKeys = excludedKeys || []

                keys = keys.filter(function(item, pos, self) {
                    return self.indexOf(item) == pos && !excludedKeys.includes(item);
                })

                keys.sort()
                return keys
            },

            buildDiff(){
                if(!this.oldVersion || !this.newVersion) {
                    return "Waiting for other version"
                }

                var keys = this.getKeys(this.oldVersion.document, this.newVersion.document, ["version", "locales" , "geometry"])

                for(let key of keys){
                    if (this.hasChanged(this.oldVersion.document[key], this.newVersion.document[key])){
                        this.diffProperties[key] = {
                            old:this.oldVersion.document[key],
                            new:this.newVersion.document[key]
                        }
                    }
                }

                var oldLocale = this.$documentUtils.getLocaleStupid(this.oldVersion.document, this.lang)
                var newLocale = this.$documentUtils.getLocaleStupid(this.newVersion.document, this.lang)
                var localeKeys = this.getKeys(oldLocale, newLocale, ["lang", "version"])

                for(let key of localeKeys){
                    var oldVal = (oldLocale[key] || "").replace(/\r\n?/g, "\n")
                    var newVal = (newLocale[key] || "").replace(/\r\n?/g, "\n")

                    if (this.hasChanged(oldVal, newVal)){
                        let diff = diff_match_patch.diff_main(oldVal, newVal)
                        diff_match_patch.diff_cleanupSemantic(diff)
                        let html = diff_match_patch.diff_prettyHtml(diff).split("<br>")
                        let result = []
                        for(let line of html){
                            if(line.search(/<(ins|del)[ >]/) != -1){
                                result.push(line)
                            }
                        }

                        this.diffLocales[key] = result.join("<br>")
                    }
                }
            },

            hasChanged(oldVal, newVal){

                var result

                if(Array.isArray(oldVal) || Array.isArray(newVal)){
                    result = JSON.stringify(oldVal) != JSON.stringify(newVal);
                } else if (oldVal == null && newVal != null || oldVal != null && newVal == null) {
                    result = true
                } else {
                    result = oldVal !== newVal
                }

                return result
            },

            loadVersion(versionId, resultProperty){
                c2c[this.documentType].getVersion(this.documentId, this.lang, versionId).then(response => {
                    this[resultProperty]=response.data;
                    if(resultProperty=="newVersion"){
                        this.title = this.$documentUtils.getLocaleStupid(this.newVersion.document, this.lang).title
                    }

                    this.buildDiff()
                });
            },

            loadVersionSmart(versionId, resultProperty, baseVersionId){
                if(versionId=="prev"){
                    c2c[this.documentType].getHistory(this.documentId, this.lang).then(response => {
                        let versions = response.data.versions;

                        for(let i=0;i<versions.length;i++){
                            if(versions[i].version_id==baseVersionId && i!=0){
                                this.loadVersion(versions[i-1].version_id, resultProperty)
                            }
                        }
                    })
                } else {
                    this.loadVersion(versionId, resultProperty)
                }
            }
        },
    }

</script>

<style scoped>
    table{
        width:100%;
    }

    td{
        width: 50%;
    }

    .locale-diff  pre{
        white-space: pre-line;
        line-height:1.3;
    }

    ins{
        background:lightgreen !important;
        text-decoration:none;
    }

    del{
        background:pink !important;
        text-decoration:none;
    }

</style>
