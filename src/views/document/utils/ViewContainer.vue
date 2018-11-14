
<template>
    <div v-if="document" class="section view-container">
        <div v-if="document && document.not_authorized" class="notification is-danger" v-translate>
            Sorry, you're not authorized to see this page.
        </div>

        <div v-else-if="document">
            <html-header v-if="!isDraftView" :title="title"/>

            <document-version-banner :version="version" :document="document" />

            <div class="box">
                <span v-if="!isDraftView" class="is-pulled-right button-bar no-print">

                    <follow-button :document="document" />

                    <history-link
                        v-if="documentType!='profile' || $user.isModerator || document.document_id == $user.id"
                        v-tooltip="$gettext('History')"
                        :document="document"
                        :lang="lang">
                        <icon-history />
                    </history-link>

                    <span
                        v-tooltip="$gettext('Add images')"
                        v-if="isEditable"
                        @click="$refs.imagesUploader.show()">
                        <icon-image />
                    </span>

                    <edit-link
                        v-if="isEditable"
                        :document="document"
                        :lang="lang"
                        v-tooltip="$gettext('Edit')">
                        <icon-edit />
                    </edit-link>
                </span>
                <div class="title is-1">
                    <icon-document :document-type="documentType"/>
                    <document-title :document="document"/>
                    <!-- outing specific  -->
                    <span v-if="documentType=='outing'" class="tag is-rounded is-primary is-size-6">
                        {{ document.date_start }}
                    </span>
                </div>
            </div>

            <slot>
                Please insert document content
            </slot>

            <images-uploader ref="imagesUploader" :lang="lang" :parent-document="document"/>

        </div>
        <div v-if="error" class="notification is-danger">
            <div v-for="(error, i) of error.response.data.errors" :key="i">
                {{ error.description }}
            </div>
        </div>
    </div>

</template>

<script>
    import ImagesUploader from '@/components/images-uploader/ImagesUploader'
    import FollowButton from './FollowButton'
    import DocumentVersionBanner from './DocumentVersionBanner'

    import isEditableMixin from './is-editable-mixin'
    import viewModeMixin from './view-mode-mixin'

    export default {
        components:{
            ImagesUploader,
            FollowButton,
            DocumentVersionBanner,
        },

        mixins : [
            isEditableMixin,
            viewModeMixin,
        ],

        props: {
            document:{
                type : Object,
                default: null,
            },
            lang:{
                type : String,
                required: true,
            },
            version:{
                type : Object,
                default: null,
            },
            error:{
                type: Object,
                default: null,
            },
        },

        computed:{
            title(){
                return this.document ? this.$documentUtils.getDocumentTitle(this.document, this.lang) : undefined
            },

            documentType(){ // is-editable mixin needs this property
                return this.$documentUtils.getDocumentType(this.document.type)
            },
        }
    }

</script>

<style scoped lang="scss">

    @import '@/assets/sass/variables.scss';

    .button-bar{
        font-size:1.5rem;
    }

    .button-bar > a{
        color:$text;
    }

    .button-bar > span, .button-bar > a{
        margin-left:0.25rem;
        cursor:pointer;
    }
    .button-bar > *:hover{
        color:$black;
    }

    .title{
        .tag{
            margin-left:1rem;
            height: auto;
        }
    }

</style>
