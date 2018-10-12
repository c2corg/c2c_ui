import c2c from '@/js/c2c'
import constants from '@/js/constants.js'

function User(){
    this.defaultUserData = {
        lang:"fr",
        roles: [],
    }

    if(window.localStorage.getItem("user"))
        this.data = JSON.parse(window.localStorage.getItem("user"))
    else
        this.data = this.defaultUserData
}

User.prototype.signIn = function(username, password){
    var result = c2c.userProfile.login(username, password)

    result.then(response => {
        this.setData(response.data)
        this.setToken()
    })
    return result
}

User.prototype.updateAccount = function(currentpassword, name, forum_username,  email, is_profile_public, newpassword){
    return c2c.userProfile.account.post(
        currentpassword,
        name,
        forum_username,
        email,
        is_profile_public,
        newpassword
    ).then(response => {
        Object.assign(this.data, response.data)
        this.setData(this.data)
    })
},

User.prototype.setToken = function(){
    c2c.setToken(this.data.token)
}

User.prototype.setData = function(data){
    this.data = data
    window.localStorage.setItem("user", JSON.stringify(this.data))
}

User.prototype.setLang = function(lang){
    if(this.isLogged()){
        c2c.userProfile.update_preferred_language(lang)
    }

    this.data.lang = lang
    window.localStorage.setItem("user", JSON.stringify(this.data))
}

User.prototype.getLang = function(){
    return this.data.lang
}

User.prototype.getId = function(){
    return this.data.id
}

User.prototype.getUserName = function(){
    return this.data.username
}

User.prototype.getName = function(){
    return this.data.name
}

User.prototype.getForumUsername = function(){
    return this.data.forum_username
}

User.prototype.isLogged = function(){
    return this.data.token
}

User.prototype.isModerator = function(){
    return this.isLogged() && this.data.roles.includes("moderator")
}

User.prototype.isExpired = function(){
    if(!this.data.expire)
        return true;

    const now = Date.now() / 1000; // in seconds
    const expire = this.userData.expire;

    if (now > expire) {
        this.clearUserData();
        return true;
    }

    return false;
}

User.prototype.clearUserData = function(){
    this.defaultUserData.lang = this.data.lang // juste save user preference to avoid a back to english.
    this.setData(this.defaultUserData)
}

User.prototype.signout = function(){
    this.clearUserData()
}

User.prototype.getLocaleStupid = function(document, lang){
    if(!document.locales)
        return null;

    for(let result of document.locales){
        if (result.lang == lang){
            return result;
        }
    }

    return null
}

User.prototype.getLocaleSmart = function(document, lang){

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

const user = new User()
user.setToken()

export default user
