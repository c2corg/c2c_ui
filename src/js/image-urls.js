import config from '@/js/config.js'

export default {
    /* 200*200 px images */
    getSquared(image) {
        return config.urls.media + '/' + image.filename.replace('.', 'SI.').replace('.svg', '.jpg')
    },

    // max 400*400
    getMedium(image) {
        return config.urls.media + '/' + image.filename.replace('.', 'MI.').replace('.svg', '.jpg')
    },

    // max 400*400
    getBig(image) {
        return config.urls.media + '/' + image.filename.replace('.', 'BI.').replace('.svg', '.jpg')
    },

    /* Original size */
    get(image) {
        return config.urls.media + '/' + image.filename
    }
}
