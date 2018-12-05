import config from '@/js/config.js'

export default {
    getSmall(image) {
        return config.urls.media + '/' + image.filename.replace('.', 'MI.').replace('.svg', '.jpg')
    },

    get(image) {
        return config.urls.media + '/' + image.filename
    }
}
