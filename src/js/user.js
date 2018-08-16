import c2c from '@/js/c2c.js'
import constants from '@/js/constants.js'


var result = {
    signIn(username, password){
        var result = c2c.user.login(username, password)

        result.then(response => {
            this.setData(response.data)
            this.setToken()
        })
        return result
    },

    setToken(){
        c2c.setToken(this.data.token)
    },

    setData(data){
        this.data = data
        window.localStorage.setItem("user", JSON.stringify(this.data))
    },

    setLang(lang){
        if(this.isLogged){
            c2c.user.update_preferred_language(lang)
        }

        this.data.lang = lang
        window.localStorage.setItem("user", JSON.stringify(this.data))
    },

    isLogged(){
        return this.data.token
    },

    isExpired(){
        if(!this.data.expire)
            return true;

        const now = Date.now() / 1000; // in seconds
        const expire = this.userData.expire;

        if (now > expire) {
            this.clearUserData();
            return true;
        }

        return false;
    },

    clearUserData(){
        defaultUserData.lang = this.data.lang
        this.setData(defaultUserData)
    },

    signout(){
        this.clearUserData()
    },

    getLocaleStupid(document, lang){
        if(!document.locales)
            return null;

        for(let result of document.locales){
            if (result.lang == lang){
                return result;
            }
        }

        return null
    },

    getLocaleSmart(document, lang){

        //first of all try to search asked lang
        var result = lang ? this.getLocaleStupid(document, lang) : null
        if(result)
            return result

        //else, search user lang
        result = this.getLocaleStupid(document, this.data.lang)
        if(result)
            return result

        //else try langs by order
        for(let lang of constants.langs){
            result = this.getLocaleStupid(document, lang)
            if(result)
                return result

        }

        //should never happen
        return null
    }
}


var defaultUserData = {
    lang:"en"
}

if(window.localStorage.getItem("user")){
    result.data = JSON.parse(window.localStorage.getItem("user"))
} else {
    result.data = defaultUserData
}

result.setToken()

export default result
