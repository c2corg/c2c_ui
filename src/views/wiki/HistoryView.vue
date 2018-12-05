<template>
    <div class="section">
        <html-header :title="$gettext('Versions')"/>

        <loading-notification :promise="promise" />

        <div v-if="history">
            <h1 class="title is-1">
                <icon-document :document-type="documentType"/>
                <router-link :to="{ name: documentType, params: {id:documentId, lang:lang} }">{{ history.title }}</router-link>
            </h1>

            <div class="buttons">
                <diff-link
                    class="button is-primary"
                    :document-type="documentType"
                    :id="documentId"
                    :lang="lang"
                    :version-from="versionFrom"
                    :version-to="versionTo"
                    v-translate>
                    Compare selected versions
                </diff-link>
                <router-link
                    :to="{name:documentType, params:{id:documentId, lang:lang}}"
                    class="button is-link"
                    v-translate>
                    See the latest version
                </router-link>
                <button class="button" disabled>
                    <span v-translate>
                        List of versions for language:
                    </span>
                    <span>
                        &nbsp;{{ $gettext(lang) }}
                    </span>
                </button>
            </div>

            <table class="table is-striped">
                <thead>
                    <tr>
                        <th/>
                        <th v-translate>Created on</th>
                        <th v-translate>Author</th>
                        <th v-translate>comment</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="version of history.versions" :key="version.verion_id">
                        <td>
                            <div v-if="documentType!='profile'" class="control">
                                <input
                                    v-model="versionFrom"
                                    :disabled="versionTo <= version.version_id"
                                    :value="version.version_id"
                                    type="radio"
                                    name="versionFrom">
                                <input
                                    v-model="versionTo"
                                    :disabled="versionFrom >= version.version_id"
                                    :value="version.version_id"
                                    type="radio"
                                    name="versionTo">
                                <diff-link
                                    v-if="version.version_id != veryFirstVersionId"
                                    :document-type="documentType"
                                    :id="documentId"
                                    :lang="lang"
                                    version-from="prev"
                                    :version-to="version.version_id"/>
                            </div>
                        </td>
                        <td>
                            <version-link :document-type="documentType" :id="documentId" :version="version.version_id" :lang="lang">
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
                </tbody>
            </table>

            <div class="buttons">
                <diff-link
                    class="button is-primary"
                    :document-type="documentType"
                    :id="documentId"
                    :lang="lang"
                    :version-from="versionFrom"
                    :version-to="versionTo"
                    v-translate>
                    Compare selected versions
                </diff-link>
                <router-link
                    :to="{name:documentType, params:{id:documentId, lang:lang}}"
                    class="button is-link"
                    v-translate>
                    See the latest version
                </router-link>
            </div>
        </div>
    </div>
</template>

<script>
    import c2c from '@/js/apis/c2c'

    export default {

        data() {
            return { // theese three data are computed
                promise: {},
                versionFrom: undefined,
                versionTo: undefined
            }
        },

        computed: {
            documentId() {
                return parseInt(this.$route.params.id)
            },
            documentType() {
                return this.$route.name.replace('-history', '')
            },
            lang() {
                return this.$route.params.lang
            },
            veryFirstVersionId() {
                return this.history.versions[this.history.versions.length - 1].version_id
            },
            history() {
                return this.promise.data
            }
        },

        watch: {
            '$route': {
                handler: 'load',
                immediate: true
            }
        },

        methods: {

            load() {
                this.promise = c2c[this.documentType].getHistory(this.documentId, this.lang).then(response => {
                    const versions = response.data.versions.reverse()
                    response.data.versions = versions

                    this.versionFrom = versions[versions.length > 1 ? 1 : 0].version_id
                    this.versionTo = versions[0].version_id
                })
            }
        }
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
