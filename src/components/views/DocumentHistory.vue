<template>
    <div v-if="history" class="section content">
        <table>
            <tr v-for="version of history.versions.reverse()" :key="version.verion_id">
                <td>
                    {{version.written_at}}
                </td>
                <td>
                    <author-link :author="version"/>
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

    import LoadingNotification from '@/components/utils/LoadingNotification'
    import AuthorLink from '@/components/views/document/utils/AuthorLink'

    export default {
        components: {
            LoadingNotification,
            AuthorLink
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
