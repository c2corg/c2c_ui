import common from './common.js'
import fieldsProperties from "./fieldsProperties.json"

const attrs = common.attributes

// values  can be a string : it describes a common.attributes fields
for(let property of Object.values(fieldsProperties))
    if(property.values && typeof property.values == "string")
        property.values = attrs[property.values]

function Field(id, properties = {}){

    this.name = id
    this.error = null

    // copy baseProperties to this, and overwrite it with specific properties
    Object.assign(this, fieldsProperties[id], properties)

    this.parent = this.parent || "document"
    this.type = this.type || "text"

    //Does the values can be translated
    if(this.i18n === undefined)
        this.i18n = Boolean(this.type=="text" || this.values)

    if(this.queryMode === undefined){
        if(this.type=="number")
            this.queryMode = "numericalRangeSlider"

        else if(this.type=="boolean")
            this.queryMode = "checkbox"

        else if(this.type=="document")
            this.queryMode = "input-document"

        else if(this.values)
            this.queryMode = "multiSelect"
    }

    if(this.defaultUrlQuery === undefined){

        if(this.queryMode=="numericalRangeSlider")
            this.defaultUrlQuery = [this.min, this.max].join(",")

        else if(this.queryMode=="valuesRangeSlider")
            this.defaultUrlQuery = [this.values[0], this.values[this.values.length-1]].join(",")

        else if(this.queryMode=="multiSelect" || this.queryMode=="orientations")
            this.defaultUrlQuery = ''

        else if(this.queryMode=="checkbox")
            this.defaultUrlQuery = 'false'

        else if(this.queryMode=="input")
            this.defaultUrlQuery = {number:0, text:''}[this.type]

        else if(this.queryMode=="activities")
            this.defaultUrlQuery =  ''

        else if(this.queryMode=="input-document")
            this.defaultUrlQuery =  ''

        else if(this.url !== undefined)
            throw "Unknow field queryMode for " + this.name + ": " + this.queryMode
    }
}

Field.prototype.valueToUrl = function(value) {
    if(this.queryMode=="numericalRangeSlider" || this.queryMode=="valuesRangeSlider")
        return value.join(",")

    if(this.queryMode=="multiSelect" || this.queryMode=="orientations" || this.queryMode=="activities")
        return value.join(",")

    if(this.queryMode=="checkbox")
        return JSON.stringify(value)

    if(this.queryMode=="input")
        return value

    if(this.queryMode=="input-document")
        return value.join(",")

    throw "Unknow field queryMode for " + this.name + ": " + this.queryMode
}

Field.prototype.urlToValue = function(url){

    if(this.queryMode=="numericalRangeSlider"){
        let value = url ? url : this.defaultUrlQuery
        value = value.split(",")
        return [parseInt(value[0]), parseInt(value[1])]
    }

    if(this.queryMode=="valuesRangeSlider"){
        let value = url ? url : this.defaultUrlQuery
        return value.split(",")
    }

    if(this.queryMode=="multiSelect" || this.queryMode=="orientations" || this.queryMode=="activities"){
        if(!url)
            return this.defaultUrlQuery ==='' ? [] : this.defaultUrlQuery.split(",")

        return url.split(",")
    }

    if(this.queryMode=="checkbox")
        return (url === null || url === undefined || url === '' || url === 'false') ? false : true


    if(this.queryMode=="input"){
        let value = url ? url : this.defaultUrlQuery

        if(this.type === "number")
            return parseInt(value)

        if(this.type === "text")
            return value

        throw `Unknow field type for ${this.name} : ${this.type}`
    }

    if(this.queryMode=="input-document")
        return url ? String(url).split(",").map(num => parseInt(num, 10)) : []

    throw "Unknow field queryMode for " + this.name + ": " + this.queryMode

}

Field.prototype.getError = function(document) {
    let value

    // for the moment, no coherence check
    if(!this.required)
        return null

    if(this.parent=="document")
        value = document[this.name]

    else if(this.parent=="locales")
        value = document.currentLocale_[this.name]

    else if(this.parent=="associations")
        value = document.associations[this.name]

    else
        throw `Unexpected parent property : ${this.parent}`

    if(!value || this.multiple && value.length===0){
        let errorName

        if(this.parent=="document")
            errorName = this.name

        else if(this.parent=="locales")
            errorName = `locales.0.${this.name}`

        else if(this.parent=="associations")
            errorName = `associations.${this.name}`

        return {
            name: errorName,
            description:`${this.name} is required`,
        }
    }

    return null
}

Field.prototype.isVisibleFor = function(params){

    var result = true

    const intersectionIsNotNull = function(arrayA, arrayB){
        for(let itemA of arrayA){
            if(arrayB.includes(itemA))
                return true
        }

        return false
    }

    if(this.activities && params.activities)
        result = intersectionIsNotNull(this.activities, params.activities)

    else if(this.waypoint_types){
        if(params.waypoint_type)
            result = this.waypoint_types.includes(params.waypoint_type)

        else if(params.waypoint_types)
            result = intersectionIsNotNull(this.waypoint_types, params.waypoint_types)

        else
            result = false
    }

    return result
}

export default Field
