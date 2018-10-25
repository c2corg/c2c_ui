import c2c from '@/apis/c2c'

export default function install(Vue){

    Vue.prototype.$user = new Vue({
        name: "User",

        data(){

            return {
                // The unique name, used to login
                userName: this.$localStorage.get("userName", null),

                // unique numerical ID
                id: this.$localStorage.get("id", null),

                // user lang, read write property everywhere : this.$user.lang
                lang: this.$localStorage.get("lang", "fr"),

                // list of roles
                roles: this.$localStorage.get("roles", []),

                // public name, a simple label
                name: this.$localStorage.get("name", null),

                // forum name
                forumUsername: this.$localStorage.get("forumUsername", null),

                // private token used for API auth
                token: this.$localStorage.get("token", null),

                // token expiration date
                expire: this.$localStorage.get("expire", null),
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
                    this.forumUsername = forum_username
                    this.name = name
                    this.commitToLocaleStorage_()
                })
            },

            updateToken(){
                c2c.setAuthorizationToken(this.token)
            },

            updateLang(){
                this.$language.setCurrent(this.lang)

                //lang is the only read-write property from outside,
                // we need to save this value
                this.commitToLocaleStorage_()

                // keep in last, because it will fail in read only mode
                if(this.isLogged)
                    c2c.userProfile.update_preferred_language(this.lang)
            },

            commitToLocaleStorage_(){
                this.$localStorage.initialize(this.$data)
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
