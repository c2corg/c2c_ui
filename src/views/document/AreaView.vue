<template>
    <div class="section">
        <document-view-header :document="document" :version="version" :promise="promise" />
        <div v-if="document" class="columns">
            <div class="column is-3">
                <map-box :document="document"/>
                <tool-box :document="document"/>
            </div>

            <div class="column is-9">
                <div class="box" v-if="document.cooked.summary || document.cooked.description">
                    <markdown-section :document="document" :field="fields.summary"/>
                    <markdown-section :document="document" :field="fields.description"/>
                </div>

                <div class="box">
                    <div class="level is-mobile">
                        <div class="level-item has-text-centered"
                             v-for="documentType of ['Waypoint', 'Route', 'Outing']"
                             :key="documentType">

                            <router-link
                                :to="{ name: documentType.toLowerCase() + 's', query: {a:documentId} }"
                                class="">
                                <div>
                                    <icon-document class="is-size-1" :document-type="documentType.toLowerCase()" />
                                </div>
                                <p>{{ $gettext(documentType + 's') }}</p>
                            </router-link>
                        </div>
                    </div>
                </div>

                <images-box :document="document" />

                <comments-box :document="document" />
            </div>
        </div>
    </div>
</template>

<script>
    import DocumentViewMixin from "./utils/DocumentViewMixin.js"

    export default {
        mixins : [ DocumentViewMixin ],
    }
</script>
