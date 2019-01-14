<template>
    <modal-card ref="modalWindow" class="images-uploader" wide>
        <input
            type="file"
            @change="filesChange"
            multiple
            accept="image/*"
            class="input-file">

        <div class="columns is-multiline images-uploader-files">
            <div
                v-for="(image, key) of images"
                :key="key"
                class="column is-one-third-fullhd is-one-third-widescreen is-half-desktop is-half-tablet is-12-mobile">
                <image-uploader
                    :image="image"
                    :categories-edition="categoriesEdition"
                    :parent-document="parentDocument"
                    @success="computeReadyForSaving"
                    @deleteImage="onDeleteImage"/>
            </div>

            <div class="column is-one-third-fullhd is-one-third-widescreen is-half-desktop is-half-tablet is-12-mobile images-uploader-message">
                <!-- this message contains HTML -->
                <!-- eslint-disable-next-line vue/no-v-html -->
                <div v-html="$gettext('Drop images here or click to upload')" />
            </div>
        </div>

        <div slot="footer" class="buttons">
            <button
                :disabled="documents.length === 0"
                class="button is-information"
                @click="categoriesEdition=!categoriesEdition">
                <span v-if="categoriesEdition">
                    Edit titles
                </span>
                <span v-else>
                    Edit categories
                </span>
            </button>
            <button
                :disabled="!readyForSaving"
                class="button is-primary"
                :class="{'is-loading': promise.loading}"
                @click="save"
                v-translate>
                Save
            </button>
            <button class="button is-warning" @click="hide" v-translate>
                Close
            </button>
        </div>
    </modal-card>
</template>

<script>
    import loadImage from 'blueimp-load-image'

    import c2c from '@/js/apis/c2c'
    import ImageUploader from './ImageUploader'

    export default {

        components: {
            ImageUploader
        },

        props: {
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
            return {
                images: {},
                categoriesEdition: false,
                promise: {},
                readyForSaving: false
            }
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

            documents() {
                const documents = []

                for (let image of Object.values(this.images)) {
                    documents.push(image.document)
                }

                return documents
            }
        },

        methods: {
            show() {
                this.$refs.modalWindow.show()
            },

            hide() {
                this.$refs.modalWindow.hide()
            },

            save() {
                this.promise = c2c.createImages(this.documents).then(() => {
                    // clean
                    this.images = {}
                    this.hide()

                    // TODO handle error
                    // TODO redraw parent
                })
            },

            filesChange(event) {
                for (let file of event.target.files) {
                    let key = file.name + '#' + file.lastModified

                    if (this.images[key] === undefined) {
                        this.computeFile(file, key)
                    }
                }

                this.computeReadyForSaving()
            },

            computeFile(file, key) {
                const image = {
                    file,
                    key,
                    exif: null,
                    blob: null,
                    src: '',
                    orientation: 0,
                    document: this.$documentUtils.buildDocument('image', this.lang)
                }

                image.document = this.$documentUtils.buildDocument('image', this.lang)

                image.document.activities = this.parentDocument.activities.slice(0)
                image.document.file_size = file.size
                image.document.image_type = this.imageType
                image.document.image_categories = []

                image.document.associations[this.$documentUtils.getDocumentType(this.parentDocument.type) + 's'] = [
                    { document_id: this.parentDocument.document_id }
                ]

                loadImage.parseMetaData(file, (metaData) => {
                    this.parseMetaData(image, metaData)
                    this.$set(this.images, image.key, image)
                })
            },

            parseMetaData(image, metaData) {
                const exif = metaData.exif ? metaData.exif.getAll() : null

                if (exif) {
                    image.orientation = metaData.exif.get('Orientation')

                    const exifDate = exif.DateTimeOriginal || exif.DateTime

                    if (exifDate) {
                        const date = this.$moment.parseDate(exifDate, 'YYYY:MM:DD HH:mm:ss')
                        image.document.date_time = date.isValid() ? date.format() : null
                    }

                    image.document.exposure_time = exif.ExposureTime
                    image.document.iso_speed = exif.PhotographicSensitivity
                    image.document.focal_length = exif.FocalLengthIn35mmFilm
                    image.document.fnumber = exif.FNumber
                    image.document.camera_name = (exif.Make && exif.Model) ? (exif.Make + ' ' + exif.Model) : null
                }
            },

            onDeleteImage(image) {
                if (this.images[image.key] !== undefined) {
                    this.$delete(this.images, image.key)
                }

                this.computeReadyForSaving()
            },

            computeReadyForSaving() {
                if (this.documents.length === 0) {
                    this.readyForSaving = false
                } else {
                    this.readyForSaving = true

                    for (let document of this.documents) {
                        if (!document.filename) {
                            this.readyForSaving = false
                        }
                    }
                }
            }
        }
    }

</script>

<style scoped lang="scss">

// TODO : modal background color with more alpha in Variables

.images-uploader{

    input {
        opacity: 0; /* invisible but it's there! */
        width: 100%;
        height: 100%;
        position: absolute;
        top:0;
        left:0;
        cursor: pointer;
    }

    .images-uploader-message > div{
        height:315px;
        text-align: center;
        border: 5px dashed #ddd;
        background: #f8f8f8;
        padding:25px;
        transition:0.2s;

        :hover {
            background: #EEEEFF;
            transition:0.2s;
        }
    }
}
</style>
