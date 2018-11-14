<template>
    <div v-if="document" class="section" :class="{preview: isPreview}">
        <html-header title="Edit a document"/>
        <h1 class="title">
            <!-- TODO  v-translate -->
            Edit
            <document-title :document="document"/>
            in
            {{ $gettext(document.currentLocale_.lang) }}
            <button class="button is-size-6" @click="isPreview=!isPreview">
                <fa-icon :icon="isPreview ? 'edit' : 'eye'" />
                &nbsp;
                <span v-if="isPreview" v-translate>Back to edit mode</span>
                <span v-else v-translate>Preview</span>
            </button>
        </h1>

        <div v-for="(error, i) of genericErrors" :key="i" class="has-text-danger has-text-weight-bold">
            {{ error.name }}
            :
            {{ error.description }}
        </div>

        <component :is="$documentUtils.getDocumentType(document.type) + '-view'" v-if="isPreview" :draft="document"/>

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
            <div v-show="mode=='edit'" class="control is-expanded">
                <input v-model="comment" type="text" class="input" :placeholder="$gettext('comment')">
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

    export default {

        components : {
            FormRow,
            AreaView,
            ArticleView,
            BookView,
            ImageView,
            MapView,
            OutingView,
            RouteView,
            WaypointView,
            XreportView,
         },

        props : {
            document:{
                type : Object,
                default: null,
            },
            genericErrors:{
                type: Array,
                required: true,
            },
            isLoading:{
                type:Boolean,
                required:true,
            },
            mode:{
                type: String,
                required: true,
            }
        },

        data() {
            return {
                comment:"",
                isPreview:false,
            }
        },
    }
</script>

<style scoped>
    .preview{
        background: #ffffe0;
    }
</style>
