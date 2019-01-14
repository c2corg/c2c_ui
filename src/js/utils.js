
import saveAs from 'file-saver'

export default {

    // from https://github.com/c2corg/v6_ui/blob/c9962a6c3bac0670eab732d563f9f480379f84d1/c2corg_ui/static/js/utils.js#L194
    stringDivider(str, width, spaceReplacer) {
        if (str && str.length > width) {
            let p = width
            while (p > 0 && (str[p] !== ' ' && str[p] !== '-')) {
                p--
            }

            if (p > 0) {
                let left
                if (str.substring(p, p + 1) === '-') {
                    left = str.substring(0, p + 1)
                } else {
                    left = str.substring(0, p)
                }
                const right = str.substring(p + 1)
                return left + spaceReplacer + this.stringDivider(right, width, spaceReplacer)
            }
        }
        return str
    },

    // from https://github.com/camptocamp/ngeo/blob/master/src/download/service.js#L27
    download(content, fileName, opt_fileType) {
        // Safari does not properly work with FileSaver. Using the the type 'text/plain'
        // makes it a least possible to show the file content so that users can
        // do a manual download with "Save as".
        // See also: https://github.com/eligrey/FileSaver.js/issues/12
        const agent = navigator.userAgent
        const isSafari = agent.indexOf('Safari') !== -1 && agent.indexOf('Chrome') === -1
        const fileType = opt_fileType !== undefined && !isSafari ? opt_fileType : 'text/plain;charset=utf-8'
        const blob = new Blob([content], { type: fileType })

        saveAs(blob, fileName)
    },

    // transform a list of c2c object to a CSV content, and download it

    downloadCsv(objects, fileName, keys) {
        const defaultGetter = (object, key) => object[key]

        const convertToCsv = function(value) {
            if (value === null || value === undefined) {
                return ''
            }

            if (typeof value === 'string') {
                return `"${value.replace(/"/g, '\\"')}"`
            }

            if (typeof value === 'boolean' || typeof value === 'number') {
                return value
            }

            if (Array.isArray(value)) {
                return `"${value.join(',')}"`
            }

            return ''
        }

        if (!objects) {
            return
        }

        let excludedKeys = new Set(['areas', 'locales', 'geometry', 'author'])

        for (let object of objects) {
            for (let key in object) {
                if (!excludedKeys.has(key)) {
                    keys.set(key, defaultGetter)
                }
            }
        }

        keys = new Map([...keys.entries()].sort())

        let lines = [[...keys.keys()].join(';')]

        for (let object of objects) {
            let line = []
            for (let [key, getter] of keys) {
                line.push(convertToCsv(getter(object, key)))
            }

            lines.push(line.join(';'))
        }

        this.download(lines.join('\n'), fileName, 'text/csv;charset=utf-8')
    },

    // does the intersection of two arrays is empty ?
    intersectionIsNotNull(arrayA, arrayB) {
        for (let itemA of arrayA) {
            if (arrayB.includes(itemA)) {
                return true
            }
        }

        return false
    }
}
