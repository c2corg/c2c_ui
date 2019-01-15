
import constants from '@/js/constants'
import c2c from '@/js/apis/c2c'

import ol from '@/js/libs/ol.js'

import TabItem from './TabItem'
import TabView from './TabView'

import EditionContainer from './EditionContainer'

import FormRow from './FormRow'
import FormInputRow from './FormInputRow'
import FormInput from './FormInput'

import QualityInputRow from './QualityInputRow'
import MapInputRow from './MapInputRow'
import AssociationsInputRow from './AssociationsInputRow'

const geoJSONFormat = new ol.format.GeoJSON()
const FORM_PROJ = 'EPSG:4326'
const DATA_PROJ = 'EPSG:3857'

export default {

    components: {
        EditionContainer,

        TabView,
        TabItem,

        FormRow,
        FormInputRow,
        FormInput,
        QualityInputRow,
        MapInputRow,
        AssociationsInputRow

    },

    data() {
        return {
            promise: {},
            fields: null, // keep fields here to set them reactive
            genericErrors: [],
            comment: '',
            latitude: null,
            longitude: null
        }
    },

    computed: {

        mode() {
            return this.$route.name.split('-')[1] // right part of route name : add or edit
        },

        documentType() {
            return this.$route.name.replace(/-(edit|add)/, '')
        },

        documentId() {
            return this.$route.params.id
        },

        lang() {
            return this.$route.params.lang
        },

        document() {
            return this.promise.data
        },

        editedLocale() {
            // in edit mode, there is only one locale
            return this.document ? this.document.locales[0] : null
        }
    },

    watch: {
        '$route': {
            handler: 'load',
            immediate: true
        },
        'document.geometry.geom': 'setLatitudeLongitude'
    },

    beforeRouteEnter(to, from, next) {
        next(vm => {
            if (!vm.$user.isLogged) {
                vm.$router.push({ name: 'auth' })
            }
        })
    },

    methods: {
        load() {
            this.fields = constants.objectDefinitions[this.documentType].fields
            this.cleanErrors()
            this.latitude = null
            this.longitude = null

            if (this.mode === 'edit') {
                this.promise = c2c[this.documentType].get(this.documentId, this.lang).then((response) => {
                    let locales = response.data.locales

                    if (locales.length === 0) { // it's a translation from an existing doc
                        locales.push(this.$documentUtils.buildLocale(this.documentType, this.lang))
                    }

                    this.afterLoad(response)
                })
            } else {
                this.promise = { data: this.$documentUtils.buildDocument(this.documentType, this.lang) }

                // add current user for outings
                if (this.documentType === 'outing') {
                    c2c.profile.get(this.$user.id).then(response => {
                        this.$documentUtils.addAssociation(this.document, response.data)
                    })
                }

                // Add associations presents in url query
                for (let letter of Object.keys(this.$route.query)) {
                    let documentType = this.$documentUtils.getDocumentType(letter)

                    if (documentType && this.$route.query[letter]) {
                        // Value may be a number or a string
                        let documentIds = String(this.$route.query[letter]).split(',')

                        for (let documentId of documentIds) {
                            c2c[documentType].get(documentId).then(response => {
                                this.$documentUtils.addAssociation(this.document, response.data)
                            })
                        }
                    }
                }

                if (this.$route.query.act) {
                    this.document.activities = this.$route.query.act.split(',')
                }

                this.afterLoad()
            }
        },

        setGeometryPoint() {
            if (this.latitude === null || this.longitude === null) {
                return
            }

            const longitude = parseFloat(String(this.longitude).replace(',', '.'))
            const latitude = parseFloat(String(this.latitude).replace(',', '.'))

            const point = new ol.geom.Point([longitude, latitude])
            point.transform(FORM_PROJ, DATA_PROJ)
            this.document.geometry.geom = geoJSONFormat.writeGeometry(point)
        },

        setLatitudeLongitude() {
            if (!this.document || !this.document.geometry || !this.document.geometry.geom) {
                return {}
            }

            const point = geoJSONFormat.readGeometry(this.document.geometry.geom)

            point.transform(DATA_PROJ, FORM_PROJ)

            const coords = point.getCoordinates()

            this.longitude = Math.round(coords[0] * 1000000) / 1000000
            this.latitude = Math.round(coords[1] * 1000000) / 1000000
        },

        afterLoad() {

        },

        beforeSave() {

        },

        save(comment) {
            this.beforeSave() // allow each view to handle some specific cases

            if (this.hasError()) {
                return
            }

            let promise

            if (this.mode === 'edit') {
                promise = c2c[this.documentType].save(this.document, comment).then(() => {
                    this.goToDocument(this.document.document_id)
                })
            } else {
                promise = c2c[this.documentType].create(this.document).then(response => {
                    this.goToDocument(response.data.document_id)
                })
            }

            promise.catch(error => {
                const data = error.response.data
                this.dispatchErrors(data.errors)
            })
        },

        // after saving, go to document
        // when it's a creation, id is in request's response.
        goToDocument(documentId) {
            this.$router.push({
                name: this.documentType,
                params: {
                    id: documentId,
                    lang: this.lang
                }
            })
        },

        hasError() {
            let hasError = false

            for (let field of Object.values(this.fields)) {
                let error = field.getError(this.document, this.editedLocale)
                hasError = hasError || error !== null
                field.error = error
            }

            return hasError
        },

        dispatchErrors(errors) {
            // TODO : errors === undefined ?
            this.cleanErrors()

            for (let error of errors) {
                let path = error.name.split('.')

                if (path[0] === 'locales') {
                    this.dispatchError(path[2], error)
                } else if (path[0] === 'associations') {
                    this.dispatchError(path[1], error)
                } else {
                    this.dispatchError(path[0], error)
                }
            }
        },

        dispatchError(fieldName, error) {
            if (this.fields[fieldName] === undefined) {
                this.genericErrors.push(error)
            } else {
                this.fields[fieldName].error = error
            }
        },

        cleanErrors() {
            this.genericErrors = []
            for (let field of Object.values(this.fields)) {
                field.error = null
            }
        }
    }
}
