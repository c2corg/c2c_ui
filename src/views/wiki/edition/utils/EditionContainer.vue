<template>
    <div v-if="document" class="section" :class="{preview: isPreview}">
        <h1 class="title">
            <span v-if="mode === 'edit'">
                <html-header :title="$gettext('Edit a document')"/>
                <!-- fixed string translations -->
                <!-- $gettext('Edit in fr') -->
                <!-- $gettext('Edit in eu') -->
                <!-- $gettext('Edit in ca') -->
                <!-- $gettext('Edit in it') -->
                <!-- $gettext('Edit in de') -->
                <!-- $gettext('Edit in en') -->
                <!-- $gettext('Edit in es') -->
                {{ $gettext('Edit in ' + $route.params.lang) }}
                :
                <document-title :document="document"/>
            </span>
            <span v-else>
                <html-header :title="$documentUtils.getCreationTitle(documentType)"/>
                {{ $documentUtils.getCreationTitle(documentType) | uppercaseFirstLetter }}
            </span>

            <button class="button is-size-6" @click="isPreview=!isPreview">
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

        <component :is="documentType + '-view'" v-if="isPreview" :draft="document"/>

        <slot v-else>
            ...
        </slot>

        <form-row label="" always-visible is-grouped>
            <div class="control">
                <button
                    class="button is-primary"
                    :class="{'is-loading':isLoading}"
                    @click="$emit('save', comment)"
                    v-translate>
                    Save
                </button>
            </div>
            <div class="control is-expanded">
                <input v-model="comment" type="text" class="input" :disabled="mode !== 'edit'" :placeholder="$gettext('comment')">
            </div>
            <div class="control">
                <button class="button is-danger" @click="$router.go(-1)" v-translate>
                    Cancel
                </button>
            </div>
        </form-row>
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
            isLoading: {
                type: Boolean,
                required: true
            },
            mode: {
                type: String,
                required: true
            }
        },

        data() {
            return {
                comment: '',
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

<style scoped>
    .preview{
        background: #ffffe0;
    }
</style>
