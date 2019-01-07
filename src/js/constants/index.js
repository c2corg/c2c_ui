import common from './common.json'
import Field from './field.js'
import documentsProperties from './documentsProperties.json'

const getFieldsObject = function(fieldsArray) {
    const result = {}

    for (const def of fieldsArray) {
        const field = new Field(def.id, def.properties)
        result[field.name] = field
    }

    return result
}

function Constants() {
    this.activities = common.attributes.activities
    this.waypoint_types = common.attributes.waypoint_types
    this.langs = common.attributes.langs
    this.quality_types = common.attributes.quality_types

    // You can find associations in
    //     https://github.com/c2corg/v6_common/blob/master/c2corg_common/associations.py

    // also, GUI avalaible associtions can be found here, on dataset attribute :
    //     https://github.com/c2corg/v6_ui/search?l=HTML&q=app-add-association

    this.documentTypes = Object.keys(documentsProperties)
    this.objectDefinitions = documentsProperties
    this.letterToDocumentType = {}

    for (const documentType of Object.keys(documentsProperties)) {
        const documentProperties = documentsProperties[documentType]
        documentProperties.fields = getFieldsObject(documentProperties.fields)
        documentProperties.documentType = documentType
        this.letterToDocumentType[documentProperties.letter] = documentType
    }

    documentsProperties.outing.fields.date_start.max = (new Date()).toISOString().substring(0, 10)
    documentsProperties.outing.fields.date_end.max = (new Date()).toISOString().substring(0, 10)
}

export default new Constants()
