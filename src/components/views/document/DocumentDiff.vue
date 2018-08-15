<template>
    <div class="section content">
        <h1>
            <icon-document :type="type" class="is-large"/>
            <span>diff</span> ({{this.lang}}) :
            <router-link :to="{ name: this.type, params: {id:this.documentId, lang:this.lang} }">{{title}}</router-link>
        </h1>
        <table>
            <tr>
                <td>
                    <div v-if="oldVersion">
                        <div>
                            <version-link :type="type" :id="documentId" :version="oldVersion.version.version_id" :lang="lang">
                                Revision #{{oldVersion.document.version}} as of {{oldVersion.version.written_at | moment('YYYY-MM-DD hh:mm:ss')}}
                            </version-link>
                        </div>
                        <div>
                            by <contributor-link :contributor="oldVersion.version"/>
                        </div>
                        <div>
                            {{oldVersion.version.comment}}
                        </div>
                        <div>
                            <diff-link v-if="oldVersion.previous_version_id"
                                :type="type" :id="documentId" :lang="lang"
                                :versionFrom="oldVersion.previous_version_id"
                                :versionTo="oldVersion.version.version_id">
                                ← previous difference
                            </diff-link>
                            <span v-else>
                                this is the first version
                            </span>
                        </div>
                    </div>
                </td>
                <td>
                    <div v-if="newVersion">
                        <div>
                            <version-link :type="type" :id="documentId" :version="newVersion.version.version_id" :lang="lang">
                                Revision #{{newVersion.document.version}} as of {{newVersion.version.written_at | moment('YYYY-MM-DD hh:mm:ss')}}
                            </version-link>
                        </div>
                        <div>
                            by <contributor-link :contributor="newVersion.version"/>
                        </div>
                        <div>
                            {{newVersion.version.comment}}
                        </div>
                        <div>
                            <diff-link v-if="newVersion.next_version_id"
                                :type="type" :id="documentId" :lang="lang"
                                :versionFrom="newVersion.version.version_id"
                                :versionTo="newVersion.next_version_id">
                                next difference →
                            </diff-link>
                            <span v-else>
                                this is the last version
                            </span>
                        </div>
                    </div>
                </td>
            </tr>
        </table>

        <div class="content" v-for="key of Object.keys(diffProperties)" :key="key">
            <h2>{{key}}</h2>
            <table>
                <tr>
                    <td>
                        <del>{{diffProperties[key].old}}</del>
                    </td>
                    <td>
                        <ins>{{diffProperties[key].new}}</ins>
                    </td>
                </tr>
            </table>
        </div>

        <div class="content" v-for="key of Object.keys(diffLocales)" :key="key">
            <h2 >{{key}}</h2>
            <div class="locale-diff">
                <div><pre><code v-html="diffLocales[key]"></code></pre></div>
            </div>
        </div>


    </div>
</template>

<script>
    import c2c from '@/js/c2c.js'
    import user from '@/js/user.js'

    import { diff_match_patch } from '@/js/diff_match_patch_uncompressed'

    export default {

        data() {
            return {
                documentId: this.$route.params.id,
                type: this.$route.name.replace("-diff",""),
                lang: this.$route.params.lang,
                title: undefined,
                oldVersion:null,
                newVersion:null,
                diffProperties:{},
                diffLocales:{}
            }
        },

        methods: {
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

                var oldLocale = user.getLocaleStupid(this.oldVersion.document, this.lang)
                var newLocale = user.getLocaleStupid(this.newVersion.document, this.lang)
                var localeKeys = this.getKeys(oldLocale, newLocale, ["lang", "version"])

                for(let key of localeKeys){
                    var oldVal = (oldLocale[key] || "").replace(/\r\n?/g, "\n")
                    var newVal = (newLocale[key] || "").replace(/\r\n?/g, "\n")

                    if (this.hasChanged(oldVal, newVal)){
                        let diff = diff_match_patch.diff_main(oldVal, newVal)
                        diff_match_patch.diff_cleanupSemantic(diff)
                        let html = diff_match_patch.diff_prettyHtml(diff)
                        let result = []
                        for(let line of html.split("\n")){
                            if(line.search(/<(ins|del)[ >]/) != -1){
                                result.push(line + "\n")
                            }
                        }
                        this.diffLocales[key] = result.join("\n")
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
                c2c[this.type].getVersion(this.documentId, this.lang, versionId).then(response => {
                    this[resultProperty]=response.data;
                    if(resultProperty=="newVersion"){
                        this.title = user.getLocaleStupid(this.newVersion.document, this.lang).title
                    }

                    this.buildDiff()
                });
            },

            loadVersionSmart(versionId, resultProperty, baseVersionId){
                if(versionId=="prev"){
                    c2c.getHistory(this.documentId, this.lang).then(response => {
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

        created() {
            this.loadVersionSmart(this.$route.params.versionFrom, "oldVersion", this.$route.params.versionTo)
            this.loadVersion(this.$route.params.versionTo, "newVersion")
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
    }

    del{
        background:pink !important;
    }

</style>
