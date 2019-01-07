<template>
    <div class="card">
        <div class="card-image img-container" :style="'background-image: url(' + src + ')'">
            <delete-button
                :visible="isSuccess || isFailed"
                class="delete-button"
                @click="$emit('deleteFile', file)"/>

            <progress
                v-if="isSaving || isFailed"
                class="progress is-large"
                :class="{
                    'is-success' : isSuccess,
                    'is-warning' : isSaving,
                    'is-danger' : isFailed}"
                :value="percentCompleted"
                max="100">
                {{ percentCompleted }}%
            </progress>

        </div>

        <div class="card-content">
            <input
                v-if="!isFailed"
                :placeholder="$gettext('title')"
                class="file-input-title"
                type="text"
                v-model="document.locales[0].title">
            <div v-else class="buttons">
                <button
                    @click="upload"
                    class="button is-primary"
                    v-translate>
                    Retry
                </button>
                <button
                    @click="$emit('deleteFile', file)"
                    class="button is-danger"
                    v-translate>
                    Cancel
                </button>
            </div>
        </div>

        <div class="card-footer" v-if="!isFailed">
            <image-action>
                <span slot="button" v-translate>
                    activities
                </span>

                <input-activity v-model="document.activities" />
            </image-action>

            <image-action>
                <span slot="button" v-translate>
                    categories
                </span>

                <div class="columns is-multiline is-gapless">
                    <div v-for="item of imageCategories" :key="item" class="column is-4">
                        <label class="checkbox">
                            <input type="checkbox" value="document.image_categories.includes(item)">
                            <span>{{ $gettext(item) }}</span>
                        </label>
                    </div>
                </div>

            </image-action>

            <image-action>
                <span slot="button" v-translate>
                    Type
                </span>

                <div style="position:relative">
                    <p v-for="(label, licence) of licences" :key="licence">
                        <input
                            class="is-checkradio"
                            name="c2c-image_type"
                            :id="_uid + '-c2c-image_type-' + licence"
                            :value="licence"
                            type="radio"
                            v-model="document.image_type"
                            :checked="document.image_type==licence">
                        <label :for="_uid + '-c2c-image_type-' + licence">{{ label }}</label>
                    </p>
                </div>
            </image-action>
        </div>

    </div>

</template>

<script>
// https://github.com/c2corg/v6_ui/blob/master/c2corg_ui/static/js/imageuploader.js
    import c2c from '@/js/apis/c2c'
    import imageUrls from '@/js/image-urls'
    import constants from '@/js/constants'

    import ImageAction from './ImageAction'

    const STATUS_INITIAL = 'Initial'
    const STATUS_SAVING = 'Saving'
    const STATUS_SUCCESS = 'Success'
    const STATUS_FAILED = 'Failed'

    export default {
        components: {
            ImageAction
        },

        props: {
            file: {
                type: File,
                required: true
            },
            lang: {
                type: String,
                required: true
            },
            parentDocument: {
                type: Object,
                required: true
            }
        },

        data() {
            const result = {
                visibleDropdown: null,
                status: STATUS_INITIAL,
                percentCompleted: 0,
                errorMessage: null,
                src: null,

                licences: {
                    collaborative: this.$gettext('collab'),
                    personal: this.$gettext('personal')
                },

                document: {
                    image_type: null,
                    activities: this.parentDocument.activities.slice(0),
                    filename: null,
                    fnumber: null,
                    focal_length: null,
                    camera_name: null,
                    iso_speed: null,
                    exposure_time: null,
                    date_time: null,
                    file_size: this.file.size,
                    associations: {

                    },
                    locales: [{
                        lang: this.lang,
                        title: ''
                    }]
                }
            }

            if (this.$user.isModerator) {
                result.licences.copyright = this.$gettext('copyright')
            }

            return result
        },

        computed: {
            imageType() {
                if (this.parentDocument.type === 'o' || this.parentDocument.type === 'u' || this.parentDocument.type === 'x') {
                    return 'personal'
                }

                if (this.parentDocument.type === 'c') {
                    return this.parentDocument.article_type === 'collab' ? 'collaborative' : 'personal'
                }

                return 'collaborative'
            },
            imageCategories() {
                return constants.objectDefinitions.image.fields.categories.values
            },
            isInitial() {
                return this.status === STATUS_INITIAL
            },
            isSaving() {
                return this.status === STATUS_SAVING
            },
            isSuccess() {
                return this.status === STATUS_SUCCESS
            },
            isFailed() {
                return this.status === STATUS_FAILED
            },
            imageUrl() {
                return imageUrls.get(this.document)
            }
        },

        created() {
            this.document.associations[this.$documentUtils.getDocumentType(this.parentDocument.type) + 's'] = [
                { document_id: this.parentDocument.document_id }
            ]

            this.document.image_type = this.imageType

            this.computeSrc_()
            this.upload()
        },

        methods: {

            onUploadProgress(event) {
                // TODO : test that
                if (event.total !== 0) {
                    this.percentCompleted = Math.floor((event.loaded * 100) / event.total)
                }
            },

            onSuccess(event) {
                this.status = STATUS_SUCCESS
                this.document.filename = event.data.filename
                this.$emit('success', this.file, this.document)
            },

            onFailure(event) {
                this.percentCompleted = 100
                this.status = STATUS_FAILED
                this.errorMessage = event.message
                this.$emit('fail', event)
            },

            upload(event) {
                this.percentCompleted = 0
                this.status = STATUS_SAVING
                this.$emit('startUpload', event)
                c2c.uploadImage(this.file, this.onUploadProgress.bind(this))
                    .then(this.onSuccess.bind(this))
                    .catch(this.onFailure.bind(this))
            },

            computeSrc_() {
                const reader = new FileReader()

                const callback = function(e) {
                    this.src = e.target.result
                }

                reader.onload = callback.bind(this)

                reader.readAsDataURL(this.file)
            }
        }
    }
</script>

<style scoped lang="scss">

@import "~bulma/sass/utilities/initial-variables.sass";

.img-container {
    width: 100%;
    height: 200px;
    transition: 0.2s;
    background-color: #e2e2e2;
    background-repeat: no-repeat;
    background-size: contain;
    background-position: center;
    position: relative;

    &:hover {
        // background-color: black;
        transition: 0.2s;

        .exif {
        background-color: rgba(83, 83, 83, 0.58);
        }

        .remove-image-btn,
        .exif p {
            opacity: 1;
            transition: 0.2s;
        }
    }

    progress{
        position:absolute;
        bottom:0;
    }
}

.file-input-title, .file-input-title:focus{
    display:block;
    width:100%;
    border:0;
    outline:0;
}

.delete-button{
    position:absolute;
    top:-1rem;
    right:-1rem;
    font-size:3rem;
}

 </style>
