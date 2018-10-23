
import saveAs from 'file-saver'
import user from '@/js/user.js' //TODO : utils shoul not use any depandencies

export default {

    // from https://github.com/c2corg/v6_ui/blob/c9962a6c3bac0670eab732d563f9f480379f84d1/c2corg_ui/static/js/utils.js#L194
    stringDivider(str, width, spaceReplacer) {
        if (str && str.length > width) {
            let p = width;
            while (p > 0 && (str[p] !== ' ' && str[p] !== '-')) {
                p--;
            }

            if (p > 0) {
                let left;
                if (str.substring(p, p + 1) === '-') {
                    left = str.substring(0, p + 1);
                } else {
                    left = str.substring(0, p);
                }
                const right = str.substring(p + 1);
                return left + spaceReplacer + this.stringDivider(right, width, spaceReplacer);
            }
        }
        return str;
    },

    getDocumentTitle(document, lang){
        if(document.type=="u" || !document.type){
            return document.name
        }

        var locale = user.getLocaleSmart(document, lang)

        if (locale.title_prefix)
            return locale.title_prefix + " : " + locale.title

        return locale.title
    },

    // from https://github.com/camptocamp/ngeo/blob/master/src/download/service.js#L27
    download(content, fileName, opt_fileType) {
        // Safari does not properly work with FileSaver. Using the the type 'text/plain'
        // makes it a least possible to show the file content so that users can
        // do a manual download with "Save as".
        // See also: https://github.com/eligrey/FileSaver.js/issues/12
        const agent = navigator.userAgent
        const isSafari = agent.indexOf('Safari') != -1 && agent.indexOf('Chrome') == -1
        const fileType = opt_fileType !== undefined && !isSafari ? opt_fileType : 'text/plain;charset=utf-8'
        const blob = new Blob([content], {type: fileType})

        saveAs(blob, fileName)
    },
}
