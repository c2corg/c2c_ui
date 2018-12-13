<template>
    <modal-card ref="modalCard">
        <div slot="title">
            <p :class="{'has-text-danger': !headerFound}">
                {{ title }}
            </p>
            <p class="buttons"/>
        </div>

        <!-- eslint-disable-next-line vue/no-v-html -->
        <section class="content" v-html="html" />

        <div slot="footer">
            <div class="buttons">
                <button class="button is-primary" @click="$refs.modalCard.hide()" v-translate>
                    Close
                </button>
                <button
                    class="button"
                    v-for="(_, otherLang) in $language.available"
                    :key="otherLang"
                    :class="{'is-primary': otherLang==lang}"
                    @click="lang = otherLang">
                    {{ otherLang }}
                </button>
                <a v-if="helper.documentId" :href="'https://www.camptocamp.org/articles/' + helper.documentId">
                    Got to article
                </a>
            </div>
        </div>
    </modal-card>
</template>

<script>
    import c2c from '@/js/apis/c2c'

    export default {

        data() {
            return {
                title: null,
                html: null,
                lang: null,
                helper: {},
                headerFound: false
            }
        },

        watch: {
            lang: 'load'
        },

        created() {
            // TODO this.$language.current is null ????
            this.lang = this.$language.current
        },

        methods: {

            show(helperId) {
                const match = helperId.match(/^(\d+)(#([a-z0-9-_]+))?$/)

                this.helper = {
                    documentId: match[1],
                    anchor: match[3]
                }

                this.load()
            },

            load() {
                this.title = this.helper.title
                this.html = this.$gettext('loading')
                c2c.article.getCooked(this.helper.documentId, this.lang).then(this.computeHtml)
                this.$refs.modalCard.show()
            },

            computeHtml(response) {
                let cooked = response.data.cooked
                let content = document.createElement('div')
                content.innerHTML = cooked.description

                if (this.helper.anchor) {
                    const html = []
                    let appending = false
                    let mainNodeTag = null
                    this.title = cooked.title
                    this.headerFound = false

                    for (let node of content.children) {
                        let isHeader = node.nodeName.match(/^[hH]\d$/)

                        if (isHeader && !appending && node.id === this.helper.anchor) {
                            appending = true
                            mainNodeTag = node.nodeName
                            this.title = node.innerHTML
                            this.headerFound = true
                        } else if (isHeader && appending && node.nodeName <= mainNodeTag) {
                            appending = false
                        } else if (appending) {
                            html.push(node.outerHTML)
                        }
                    }
                    this.html = html.length !== 0 ? html.join('\n') : content.innerHTML
                } else {
                    this.html = content.innerHTML
                }
            },

            getHelper(name) {
            }
        }
    }
</script>
