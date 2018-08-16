
import axios from 'axios';
import config from '@/js/config.js'

function c2c(){
    var this_ = this

    // axios instances shares same common headers. this trick fix this.
    this.axios = axios.create({headers:{common:{}}});

    this.apiUrl = config.apiUrl
    this.mediaUrl = config.mediaUrl

    this.user = {
        login(username, password){
            return this_.axios.post(this_.apiUrl + '/users/login', {
                username,
                password,
                discourse:false
            })
        },

        update_preferred_language(lang){
            return this_.axios.post(this_.apiUrl + '/users/update_preferred_language', {lang})
        },

        preferences:{
            get(){
                return this_.axios.get(this_.apiUrl + '/users/preferences')
            },

            post(preferences){
                return this_.axios.post(this_.apiUrl + '/users/preferences', preferences)
            }
        },

        mailinglists:{
            get(){
                return this_.axios.get(this_.apiUrl + '/users/mailinglists')
            },

            post(mailinglists){
                return this_.axios.post(this_.apiUrl + '/users/mailinglists', mailinglists)
            }
        },

        following:{
            get(){
                return this_.axios.get(this_.apiUrl + '/users/following')
            }
        },

        account:{
            get(){
                return this_.axios.get(this_.apiUrl + '/users/account')
            },

            post(currentpassword, name, forum_username,  email, is_profile_public, newpassword){
                var payload = {
                    currentpassword,
                }

                if(name!==null)
                    payload.name = name

                if(is_profile_public!==null)
                    payload.is_profile_public = is_profile_public

                if(email!==null)
                    payload.email = email

                if(forum_username!==null)
                    payload.forum_username = forum_username

                if(newpassword!==null)
                    payload.newpassword = newpassword

                return this_.axios.post(this_.apiUrl + '/users/account', payload)
            }
        },
    };

    const types = ["area", "article", "book", "image", "map", "outing", "profile", "route", "waypoint", "xreport"]

    for(let type of types){
        this[type + "s"] = {
            get(params){
                return this_.axios.get(this_.apiUrl + '/' + type + 's', {params})
            }
        };

        this[type] = {
            get(id){
                return this_.axios.get(this_.apiUrl + '/' + type + 's/' + id)
            },

            getVersion(id, lang, versionId){
                return this_.axios.get(this_.apiUrl + '/' + type + 's/' + id + '/' + lang + '/' + versionId)
            },

            save(document, comment){
                return this_.axios.put(this_.apiUrl + '/' + type + 's/' + document.document_id, {
                    document,
                    message:comment
                })
            }

        };
    }
}

c2c.prototype.setToken = function(token){
    if(token){
        this.axios.defaults.headers.common.Authorization = 'JWT token="' + token + '"'
    } else if(this.axios.defaults.headers.common.Authorization){
        delete this.axios.defaults.headers.common.Authorization
    }
}

c2c.prototype.getSmallImageUrl = function(image){
    return this.mediaUrl + '/' + image.filename.replace('.', 'MI.').replace('.svg', '.jpg')
}

c2c.prototype.getImageUrl = function(image){
    return this.mediaUrl + '/' + image.filename
}

c2c.prototype.search = function(params){
    return this.axios.get(this.apiUrl + '/search', {params})
}

c2c.prototype.getRecentChanges = function(params){
    return this.axios.get(this.apiUrl + '/documents/changes', {params})
}

c2c.prototype.getHistory = function(document_id, lang){
    return this.axios.get(this.apiUrl + '/document/' + document_id + '/history/' + lang)
}

c2c.prototype.getFeed = function(params){
    return this.axios.get(this.apiUrl + '/feed', {params})
}

export default new c2c();
