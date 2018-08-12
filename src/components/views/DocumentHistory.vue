<template>
    <div v-if="history" class="section content">
        <table>
            <tr v-for="version of history.versions.reverse()" :key="version.verion_id">
                <td>
                    <div class="control">
                        <label class="radio">
                            <input type="radio" name="versionFrom" v-model="versionFrom">
                            &nbsp;
                        </label>
                        <label>
                            <input type="radio" name="versionTo" v-model="versionTo">
                        </label>
                    </div>
                </td>
                <td>
                    {{version.written_at}}
                </td>
                <td>
                    <contributor-link :contributor="version"/>
                </td>
                <td>
                    {{version.comment}}
                </td>
            </tr>
        </table>
    </div>
</template>

<script>
    import c2c from '@/js/c2c.js'

    import ContributorLink from '@/components/utils/ContributorLink'

    export default {
        components: {
            ContributorLink
        },

        data() {
            return {
                history: null,
            }
        },

        created() {
            c2c.getHistory(this.$route.params.id, this.$route.params.lang).then(response => {
                this.history=response.data;
            });
        },
    }

</script>
