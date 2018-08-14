
import axios from 'axios';

var apiUrl = "https://api.demov6.camptocamp.org"

var result = {

    documentType : {
        a:"area",
        c:"article",
        b:"book",
        i:"image", //todo
        m:"map",
        o:"outing",
        r:"route",
        u:"profile",
        w:"waypoint",
        x:"xreport"
    },

    documentsGeoLocalization: [
        "routes",
        "waypoints",
        "profiles",
        "outings",
        "images",
        "xreports"
    ],

    getSmallImageUrl(image){
        return 'https://media.camptocamp.org/c2corg_active/' + image.filename.replace('.', 'MI.').replace('.svg', '.jpg')
    },

    getImageUrl(image){
        return 'https://media.camptocamp.org/c2corg_active/' + image.filename
    },

    search(params){
        return axios.get(apiUrl + '/search', {params})
    },

    getRecentChanges(params){
        return axios.get(apiUrl + '/documents/changes', {params})
    },

    getHistory(document_id, lang){
        return axios.get(apiUrl + '/document/' + document_id + '/history/' + lang)
    },

    login(username, password){
        return axios.post(apiUrl + '/users/login', {
            username,
            password,
            discourse:false
        })
    },

    userAccount:{
        get(){
            return axios.get(apiUrl + '/users/account')
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

            return axios.post(apiUrl + '/users/account', payload)
        }
    },

    getLocale(document, lang){
        var result = {}

        document.locales.forEach( locale => {
            if (locale.lang == lang){
                result = locale
                return;
            }
        })

        return result
    }
};

["area", "article", "book", "image", "map", "outing", "profile", "route", "waypoint", "xreport"].forEach(type => {

    result[type + "s"] = {
        get(params){
            return axios.get(apiUrl + '/' + type + 's', {params})
        }
    }

    result[type] = {
        get(id){
            return axios.get(apiUrl + '/' + type + 's/' + id)
        },

        getVersion(id, lang, versionId){
            return axios.get(apiUrl + '/' + type + 's/' + id + '/' + lang + '/' + versionId)
        },

        save(document, comment){
            return axios.put(apiUrl + '/' + type + 's/' + document.document_id, {
                document,
                message:comment
            })
        }

    }

})

export default result;
