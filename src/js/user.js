import c2c from '@/js/c2c.js'
import axios from 'axios';

var result = {
    signIn(username, password){
        var result = c2c.login(username, password)

        result.then(response => {
            this.data = response.data
            this.setToken()
            window.localStorage.setItem("user", JSON.stringify(response.data))
        })
        return result
    },

    setToken(){
        if(this.data.token){
            axios.defaults.headers.common['Authorization'] = 'JWT token="' + this.data.token + '"'
        }
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
            this.removeUserData();
            return true;
        }

        return false;
    },

    removeUserData(){
        this.data = {}
        window.localStorage.removeItem("user")
    },

    signout(){
        this.removeUserData()
    },

    data:JSON.parse(window.localStorage.getItem("user") || '{}')
}

result.setToken()

export default result
