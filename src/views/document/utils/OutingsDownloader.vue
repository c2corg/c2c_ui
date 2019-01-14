<template>
    <button
        class="button is-primary"
        :class="{'is-loading': isLoading}"
        @click="downloadOutings"
        v-translate>
        Download outings
    </button>
</template>

<script>
    import c2c from '@/js/apis/c2c'
    import utils from '@/js/utils'

    export default {
        props: {
            profileId: {
                type: Number,
                required: true
            }
        },

        data() {
            return {
                isLoading: false
            }
        },

        methods: {
            downloadOutings() {
                this.isLoading = true
                let outings = []

                const extraKeys = new Map([
                    ['title', this.$documentUtils.getDocumentTitle],
                    ['url', object => {
                        const href = this.$router.resolve({ name: 'outing', params: { id: object.document_id } }).href
                        return `https://www.camptocamp.org${href}`
                    }]
                ])

                const download = function(offset) {
                    c2c.outing.getAll({ u: this.profileId, limit: 50, offset })
                        .then(response => {
                            for (let document of response.data.documents) {
                                outings.push(document)
                            }
                            if (response.data.documents.length === 0 || outings.length === response.data.total) {
                                utils.downloadCsv(outings, 'outings.csv', extraKeys)
                                this.isLoading = false
                            } else {
                                download(offset + 50)
                            }
                        })
                        .catch(error => {
                            this.isLoading = false
                            window.alert(error.response.data.errors[0].description)
                        })
                }.bind(this)

                download(0)
            }
        }
    }
</script>
