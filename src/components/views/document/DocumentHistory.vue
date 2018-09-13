<template>
    <div v-if="history" class="section content">
        <h1>
            <icon-document :type="type" class="is-large"/>
            <span>history</span> ({{ lang }}) :
            <router-link :to="{ name: type, params: {id:documentId, lang:lang} }">{{ history.title }}</router-link>
        </h1>
        <div class="field is-grouped">
            <div class="control">
                <button v-if="type!='profile'" class="button is-primary" @click="gotToDiff">
                    compare selected versions
                </button>
            </div>
            <div class="control">
                <router-link :to="{name:type, params:{id:documentId, lang:lang}}" class="button is-link">
                    go to last version
                </router-link>
            </div>
        </div>
        <table>
            <tr>
                <th/>
                <th>created on</th>
                <th>author</th>
                <th>comment</th>
            </tr>
            <tr v-for="version of history.versions" :key="version.verion_id">
                <td>
                    <div v-if="type!='profile'" class="control">
                        <input v-model="versionFrom"
                               :disabled="versionTo <= version.version_id"
                               :value="version.version_id"
                               type="radio"
                               name="versionFrom">
                        <input v-model="versionTo"
                               :disabled="versionFrom >= version.version_id"
                               :value="version.version_id"
                               type="radio"
                               name="versionTo">
                        <diff-link v-if="version.version_id != last_version_id" :type="type" :id="documentId" :lang="lang"
                                   :version-to="version.version_id"/>
                    </div>
                </td>
                <td>
                    <version-link :type="type" :id="documentId" :version="version.version_id" :lang="lang">
                        {{ version.written_at | moment("YYYY-MM-DD hh:mm:ss") }}
                    </version-link>
                </td>
                <td>
                    <contributor-link :contributor="version"/>
                </td>
                <td>
                    {{ version.comment }}
                </td>
            </tr>
        </table>
        <div class="field is-grouped">
            <div class="control">
                <button class="button is-primary" @click="gotToDiff">
                    compare selected versions
                </button>
            </div>
            <div class="control">
                <router-link :to="{name:type, params:{id:documentId, lang:lang}}" class="button is-link">
                    go to last version
                </router-link>
            </div>
        </div>
    </div>
</template>

<script>
    import c2c from '@/js/c2c.js'

    export default {

        data() {
            return {
                documentId: this.$route.params.id,
                type: this.$route.name.replace("-history",""),
                lang: this.$route.params.lang,
                history: null,
                versionFrom:undefined,
                versionTo:undefined,
                last_version_id:undefined,
            }
        },

        created() {
            c2c.getHistory(this.documentId, this.lang).then(response => {
                this.history=response.data;
                this.last_version_id = this.history.versions[0].version_id
                this.history.versions = this.history.versions.reverse()
                this.versionFrom = this.history.versions[this.history.versions.length-1].version_id
                this.versionTo = this.history.versions[0].version_id
            });
        },

        methods: {
            gotToDiff(){

                this.$router.push({
                    name: this.type + "-diff", params: {
                        versionFrom:this.versionFrom,
                        versionTo:this.versionTo,
                        lang:this.lang
                    }
                })
            }
        },
    }

</script>

<style scoped>
    td{
        white-space:nowrap;
    }

    td:nth-child(4) {
        width: 100%;
        white-space:normal;
        font-style:italic;
    }
</style>
