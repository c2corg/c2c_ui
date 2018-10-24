import c2c from '@/js/c2c'
import localStorage from '@/js/localStorage'

export default function install(Vue){

    const profileData = localStorage.getItem("user")

    Vue.prototype.$user = new Vue({
        data(){
            return {
                // The unique name, used to login
                userName: profileData.get("userName", null),

                // unique numerical ID
                id: profileData.get("id", null),

                // user lang, read write property everywhere : this.$user.lang
                lang: profileData.get("lang", "fr"),

                // list of roles
                roles: profileData.get("roles", []),

                // public name, a simple label
                name: profileData.get("name", null),

                // forum name
                forumUsername: profileData.get("forumUsername", null),

                // private token used for API auth
                token: profileData.get("token", null),

                // token expiration date
                expire: profileData.get("expire", null),
            }
        },

        computed:{
            isModerator(){
                return this.roles.includes("moderator")
            },
            isLogged(){
                return Boolean(this.token)
            }
        },

        watch:{
            "lang":"updateLang",
            "token":{
                handler:"updateToken",
                immediate:true,
            }
        },

        created(){
            this.checkExpiration()
        },

        methods:{
            signIn(username, password){
                return c2c.userProfile.login(username, password)
                .then(response => {
                    this.lang = response.data.lang
                    this.token = response.data.token
                    this.roles = response.data.roles
                    this.id = response.data.id
                    this.userName = response.data.username
                    this.name = response.data.name
                    this.forumUsername = response.data.forum_username
                    this.expire = response.data.expire

                    this.commitToLocaleStorage_()
                })
            },

            signout(){
                this.token = null
                this.roles = []
                this.id = null
                this.userName = null
                this.name = null
                this.forumUsername = null
                this.expire = null

                this.commitToLocaleStorage_()
            },


            updateAccount(currentpassword, name, forum_username,  email, is_profile_public, newpassword){
                return c2c.userProfile.account.post(
                    currentpassword,
                    name,
                    forum_username,
                    email,
                    is_profile_public,
                    newpassword
                ).then(() => {
                    this.forum_username = forum_username
                    this.name = name
                    this.commitToLocaleStorage_()
                })
            },

            updateToken(){
                c2c.setAuthorizationToken(this.token)
            },

            updateLang(){
                this.$language.setCurrent(this.lang)
                if(this.isLogged)
                    c2c.userProfile.update_preferred_language(this.lang)

                //lang is the only read-write property from outside,
                // we need to save this value
                this.commitToLocaleStorage_()
            },

            commitToLocaleStorage_(){
                profileData.initialize(this.$data)
            },

            checkExpiration(){
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
        }
    })
}
