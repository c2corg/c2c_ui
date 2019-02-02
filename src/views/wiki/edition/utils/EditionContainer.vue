<template>
    <div v-if="document" class="section" :class="{preview: isPreview}">
        <div class="has-edition-width">
            <h1 class="title is-1">
                <icon-edit />
                <span v-if="mode === 'edit'">
                    <html-header :title="$gettext('Edit a document')"/>
                    <document-title :document="document"/>
                </span>
                <span v-else>
                    <html-header :title="$documentUtils.getCreationTitle(documentType)"/>
                    {{ $documentUtils.getCreationTitle(documentType) | uppercaseFirstLetter }}
                </span>
                <span> ({{ $route.params.lang }})</span>

                <button class="button is-size-6 is-pulled-right" @click="isPreview=!isPreview">
                    <span v-show="isPreview">
                        <fa-icon icon="edit" />&nbsp;
                        <span v-translate>Back to edit mode</span>
                    </span>
                    <span v-show="!isPreview">
                        <fa-icon icon="eye" />&nbsp;
                        <span v-translate>Preview</span>
                    </span>
                </button>
            </h1>

            <div v-for="(error, i) of genericErrors" :key="i" class="has-text-danger has-text-weight-bold">
                {{ error.name }}
                :
                {{ error.description }}
            </div>

        </div>

        <component :is="documentType + '-view'" v-if="isPreview" :draft="document"/>

        <div v-show="!isPreview" class="has-edition-width">
            <hr>

            <slot >
                ...
            </slot>
        </div>
    </div>
</template>

<script>

    import FormRow from './FormRow'

    import AreaView from '@/views/document/AreaView'
    import ArticleView from '@/views/document/ArticleView'
    import BookView from '@/views/document/BookView'
    import ImageView from '@/views/document/ImageView'
    import MapView from '@/views/document/MapView'
    import OutingView from '@/views/document/OutingView'
    import RouteView from '@/views/document/RouteView'
    import WaypointView from '@/views/document/WaypointView'
    import XreportView from '@/views/document/XreportView'
    import ProfileView from '@/views/document/ProfileView'

    export default {

        components: {
            FormRow,
            AreaView,
            ArticleView,
            BookView,
            ImageView,
            MapView,
            OutingView,
            ProfileView,
            RouteView,
            WaypointView,
            XreportView
        },

        props: {
            document: {
                type: Object,
                default: null
            },
            genericErrors: {
                type: Array,
                required: true
            },
            mode: {
                type: String,
                required: true
            }
        },

        data() {
            return {
                isPreview: false
            }
        },

        computed: {
            documentType() {
                return this.$documentUtils.getDocumentType(this.document.type)
            }
        },

        watch: {
            '$route': 'reset'
        },

        methods: {
            reset() {
                this.comment = ''
                this.isPreview = false
            }
        }
    }
</script>

<style scoped lang="scss">
    .preview{
        background: #ffffe0;
    }

    .has-edition-width{
        margin:auto;
        width: 100%;
        max-width: 840px;
    }
</style>
