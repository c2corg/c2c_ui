import c2c from '@/js/c2c'
import constants from '@/js/constants.js'
import localStorage from '@/js/localStorage'

function User(){
    this.defaultLang = "fr"
    this.profileData = localStorage.getItem("user")
    c2c.setAuthorizationToken(this.profileData.get("token"))
    this.checkExpiration()
}

Object.defineProperty(User.prototype, "roles", {get(){
    return this.profileData.get("roles") || []
}})

Object.defineProperty(User.prototype, "lang", {

    get(){
        return this.profileData.get("lang") || this.defaultLang
    },

    set(lang){
        if(this.isLogged)
            c2c.userProfile.update_preferred_language(lang)

        this.profileData.set("lang", lang)
    },
})

Object.defineProperty(User.prototype, "token", { get(){
    return this.profileData.get("token")
}})

Object.defineProperty(User.prototype, "id", { get(){
    return this.profileData.get("id")
}})

Object.defineProperty(User.prototype, "userName", { get(){
    return this.profileData.get("username")
}})

Object.defineProperty(User.prototype, "name", { get(){
    return this.profileData.get("name")
}})

Object.defineProperty(User.prototype, "forumUsername",  {get(){
    return this.profileData.get("forum_username")
}})

Object.defineProperty(User.prototype, "isLogged", { get(){
    return Boolean(this.profileData.get("token"))
}})

Object.defineProperty(User.prototype, "isModerator", { get(){
    return this.roles.includes("moderator")
}})

Object.defineProperty(User.prototype, "expire", { get(){
    return this.profileData.get("expire")
}})


User.prototype.signIn = function(username, password){
    return c2c.userProfile.login(username, password)
    .then(response => {
        this.profileData.assign(response.data)
        c2c.setAuthorizationToken(this.token)
    })
}

User.prototype.signout = function(){
    this.defaultLang = this.lang  // juste save user preference to avoid a back to english.
    this.profileData.clear()
    c2c.setAuthorizationToken(undefined)
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
        this.profileData.assign(response.data)
    })
}

User.prototype.checkExpiration = function(){
    if(!this.expire)
        return true;

    const now = Date.now() / 1000; // in seconds
    const expire = this.expire

    if (now > expire) {
        this.signout();
        return true;
    }

    return false;
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
    result = this.getLocaleStupid(document, this.lang)
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

export default new User()
