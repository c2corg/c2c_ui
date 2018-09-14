// please see how-tos for more explanations

const join = function(...args){
    return Object.assign({}, ...args)
}

const prop = {
    requiredString:{
        type: String,
        required: true,
    },

    optionalString:{
        type: String,
        required: false,
        default: undefined,
    },

    requiredNumber:{
        type: Number,
        required: true,
    },

    requiredBoolean:{
        type: Boolean,
        required: true,
    },

    optionalBoolean:{
        type: Boolean,
        required: false,
        default: undefined,
    },
    
    requiredArray:{
        type: Array,
        required: true,
    },

    requiredObject:{
        type: Object,
        required: true,
    },

    optionalObject:{
        type: Object,
        required: false,
        default: undefined,
    },
}

const props = {

    requiredDocument:{
        document: prop.requiredObject
    },

    requiredLocale:{
        locale: prop.requiredObject
    },


    requiredFields:{
        fields: prop.requiredObject
    },
}

props.documentViewProperties = join(
    props.requiredDocument,
    props.requiredLocale,
    props.requiredFields
)


export {prop, props, join}
