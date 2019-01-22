import config from '@/js/config.ts'

const getUrl = function(image, size) {
    size = size || ''

    if (!image.filename) {
        let sizeArg = size ? `?$size=${size}` : ''
        return `${config.urls.api}/images/proxy/${image.document_id}${sizeArg}`
    }

    let backendFilename = image.filename.replace('.', `${size}.`).replace('.svg', '.jpg')

    return `${config.urls.media}/${backendFilename}`
}

export default {
    /* 200*200 px images */
    getSquared(image) {
        return getUrl(image, 'SI')
    },

    // max 400*400
    getMedium(image) {
        return getUrl(image, 'MI')
    },

    //
    getBig(image) {
        return getUrl(image, 'BI')
    },

    /* Original size */
    get(image) {
        return getUrl(image)
    }
}
