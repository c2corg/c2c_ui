


function getTranslation(lang, messages, msgid) { //, n = 1, context = null, defaultPlural = null){
    if(messages===undefined){
        // `messages are not yet available`
        return msgid
    }

    if(!msgid)
        return msgid

    msgid = msgid.replace(/^[\r\n\s]*/, "")
    msgid = msgid.replace(/[\r\n\s]*$/, "")

    if(messages[msgid] === undefined) {
        //eslint-disable-next-line
        console.warn(`Untranslated ${lang} key found: "${msgid}"`)
        return msgid
    }

    return messages[msgid]
}

export default function install(Vue, options = {}){

    let languageVm = new Vue({
        data: {
            current: null,
        },

        created: function () {
            // Non-reactive data.
            this.available = options.availableLanguages
            this.translations = {}

            this.setCurrent(options.current)
        },

        methods:{

            setCurrent(lang){
                // we must defer lang setter
                // because we may need to lazy load data
                this._getMessages(lang).then(() => {
                    this.current = lang
                })
            },

            _getMessages(lang){

                // TODO : normally, webpack should handle this
                if(this.translations[lang] !== undefined){
                    return new Promise((resolve) => {
                        resolve(this.translations[lang])
                    })
                }

                let messages = options.getMessages(lang)

                return new Promise(resolve => {
                    if(messages.then){ // messages is a promise
                        messages.then(translations => {
                            this.translations[lang] = translations[lang]
                            resolve(translations[lang])
                        })
                    } else {
                        this.translations[lang] = messages[lang]
                        resolve(messages[lang])
                    }
                })
            },

            gettext(msgid){
                return getTranslation(this.current, this.translations[this.current], msgid)
            },

            updateElement(element){
                if(element.dataset.msgid===undefined)
                    element.dataset.msgid = element.innerText

                element.innerText = this.gettext(element.dataset.msgid)
            },
        }
    })

    Object.defineProperty(Vue.prototype, '$language', {
        get() {
            return languageVm
        }
    })

    // An option to support translation with HTML content: `v-translate`.
    Vue.directive('translate', {
        bind(el){
            // console.log("bind", el)
            languageVm.updateElement(el)
        },
        inserted(el){
            // console.log("inserted", el)
            languageVm.updateElement(el)
        },
        update(el){
            // console.log("update", el)
            languageVm.updateElement(el)
        },
    })

    Vue.prototype.$gettext = languageVm.gettext.bind(languageVm)
}
