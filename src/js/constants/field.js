import fieldsProperties from "./fieldsProperties"

function Field(name, properties){

    this.name = name
    this.error = null

    var baseProperties = fieldsProperties[name]

    for(let key of Object.keys(baseProperties)){
        this[key] = baseProperties[key]
    }

    if(properties){
        for(let key of Object.keys(properties)){
            this[key] = properties[key]
        }
    }

    this.parent = this.parent || "document"
    this.type = this.type || "text"

    //Does the values can be translated
    if(this.i18n === undefined){
        if(this.type=="number")
            this.i18n = false
        else if(this.type=="text")
            this.i18n = true
        else if(this.values)
            this.i18n = true
        else
            this.i18n = false
    }

    if(!this.queryMode){
        if(this.type=="number"){
            this.queryMode = "numericalRangeSlider"

        } else if(this.type=="boolean"){
            this.queryMode = "checkbox"

        } else if(this.type=="document"){
            this.queryMode = "input-document"

        } else if(this.values){
            this.queryMode = "multiSelect"
        }
    }

    const identity = function(value){ return value }
    const joinWithComma = function(value){ return value.join(",") }

    const splitWithComma = function(value){
        value = value ? value : this.defaultUrlQuery
        return value.split(",")
    }

    const splitIntegersWithComma = function(value){
        value = value ? value : this.defaultUrlQuery
        value = value.split(",")
        return [parseInt(value[0]), parseInt(value[1])]
    }

    const parseUrlArray = function(value){
        if(!value)
            return this.defaultUrlQuery ==='' ? [] : this.defaultUrlQuery.split(",")

        return value.split(",")
    }

    const parseUrlBoolean = function(value){
        if(value === null || value === undefined || value === '' || value === 'false')
            return false

        return true
    }

    const parseUrlDefault = function(value){
        value = value ? value : this.defaultUrlQuery

        if(this.type === "number"){
            return parseInt(value)
        }

        else if(this.type === "text"){
            return value
        }

        else
            throw "Unknow field type : " + this
    }

    var defaultUrlQuery

    if(this.queryMode=="numericalRangeSlider"){
        this.valueToUrl = joinWithComma
        this.urlToValue = splitIntegersWithComma
        defaultUrlQuery = [this.min, this.max].join(",")
    }

    else if(this.queryMode=="valuesRangeSlider"){
        this.valueToUrl = joinWithComma
        this.urlToValue = splitWithComma
        defaultUrlQuery =  [this.values[0], this.values[this.values.length-1]].join(",")
    }

    else if(this.queryMode=="multiSelect" || this.queryMode=="orientations"){
        this.valueToUrl = joinWithComma
        this.urlToValue = parseUrlArray
        defaultUrlQuery =  ''
    }

    else if(this.queryMode=="checkbox"){
        this.valueToUrl = JSON.stringify
        this.urlToValue = parseUrlBoolean
        defaultUrlQuery =  'false'
    }

    else if(this.queryMode=="input"){
        this.valueToUrl = identity
        this.urlToValue = parseUrlDefault
        defaultUrlQuery =  {number:0, text:''}[this.type]
    }

    else if(this.queryMode=="activities"){
        this.valueToUrl = joinWithComma
        this.urlToValue = parseUrlArray
        defaultUrlQuery =  ''
    }

    else if(this.queryMode=="input-document"){
        this.valueToUrl = array => array.map(item => item.document_id).join(",")
        this.urlToValue = undefined // TODO
    }

    else if(this.url !== undefined){
        throw "Unknow field queryMode for " + this.name + ": " + this.queryMode
    }

    this.defaultUrlQuery = this.defaultUrlQuery === undefined ? defaultUrlQuery : this.defaultUrlQuery
}

Field.prototype.getError = function(document) {
    let value

    if(this.parent=="document")
        value = document[this.name]

    else if(this.parent=="locales")
        value = document.currentLocale_[this.name]

    else if(this.parent=="associations")
        value = document.associations[this.name]

    else
        throw `Unexpected parent property : ${this.parent}`

    if(this.required && (!value || this.multiple && value.length===0)){
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
