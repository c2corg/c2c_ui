

let languageVm  // Singleton.


function getTranslation(messages, msgid) { //, n = 1, context = null, defaultPlural = null){
    if(messages[msgid] === undefined) {
        //eslint-disable-next-line
        console.warn(`Untranslated ${messages.lang} key found: ${msgid}`)
        return msgid
    } else {
        return messages[msgid]
    }
}

export default function install(Vue, options = {}){

    languageVm = new Vue({
        data: {
            current: options.current,
        },

        watch:{
            current : '_updateAll'
        },

        created: function () {
            // Non-reactive data.
            this.available = options.availableLanguages
            this.elements = []
            this.translations = {}
            this.gettextResults = {}
        },

        methods:{

            gettext(msgid){
                if(this.gettextResults[msgid] === undefined){

                    const result = {
                        message:msgid,
                        msgid,
                    }

                    this.getCurrentMessages().then(messages => {
                        result.message = getTranslation(messages, msgid)
                    })

                    this.gettextResults[msgid] = result
                }

                return this.gettextResults[msgid]
            },

            _updateAll(){

                this.getCurrentMessages().then(messages => {

                    for(let node of this.elements){
                        node.innerText = getTranslation(messages, node.dataset.msgid)
                    }

                    for(let item of Object.values(this.gettextResults)){
                        item.message = getTranslation(messages, item.msgid)
                    }
                })

            },

            updateElements(elements){

                this.getCurrentMessages().then(messages => {
                    for(let node of elements){
                        node.innerText = getTranslation(messages, node.dataset.msgid)
                    }
                })
            },

            getCurrentMessages(){
                const lang = this.current

                if(this.translations[lang] !== undefined){
                    return new Promise((resolve) => {
                        resolve(this.translations[lang])
                    })
                }

                var imp

                if(lang=='en')
                    imp = import(/* webpackChunkName: "translations-fr-en" */ `@/translations/dist/en.json`)

                else if(lang=='fr')
                    imp = import(/* webpackChunkName: "translations-fr-en" */`@/translations/dist/fr.json`)

                else if(lang=='ca')
                    imp = import(/* webpackChunkName: "translations-ca-eu" */`@/translations/dist/ca.json`)

                else if(lang=='eu')
                    imp = import(/* webpackChunkName: "translations-ca-eu" */`@/translations/dist/eu.json`)

                else if(lang=='it')
                    imp = import(/* webpackChunkName: "translations-it-de-es" */`@/translations/dist/it.json`)

                else if(lang=='de')
                    imp = import(/* webpackChunkName: "translations-it-de-es" */`@/translations/dist/de.json`)

                else if(lang=='es')
                    imp = import(/* webpackChunkName: "translations-it-de-es" */`@/translations/dist/es.json`)


                return new Promise(resolve => {
                    imp.then(translations => {
                        this.translations[lang] = translations[lang]
                        translations[lang].lang = lang
                        resolve(translations[lang])
                    })
                })
            }
        }
    })


  // Override the main init sequence. This is called for every instance.
    const init = Vue.prototype._init
    Vue.prototype._init = function (options = {}) {
        const root = options._parent || options.parent || this
        // Expose languageVm to every instance.
        this.$language = root.$language || languageVm
        init.call(this, options)
    }

    // Override the main destroy sequence to destroy all languageVm watchers.
    const destroy = Vue.prototype._destroy
    Vue.prototype._destroy = function () {
        this.$language = null
        destroy.apply(this, arguments)
    }

    // An option to support translation with HTML content: `v-translate`.
    Vue.directive('translate', {
        bind(el){
            let msgid = el.innerText
            el.dataset.msgid = msgid
            languageVm.elements.push(el)
        },
        inserted(el){
            languageVm.updateElements([el])
        },
        update(el){
            languageVm.updateElements([el])
        },
        // componentUpdated(el, binding, vnode){
        //
        // },
        unbind(el){
            languageVm.elements.splice(languageVm.elements.indexOf(el), 1)
        },
    })

    Vue.prototype.$gettext = languageVm.gettext.bind(languageVm)
}
