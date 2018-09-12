<template>
    <nav class="navbar is-light">
        <div class="navbar-brand">
            <router-link class="navbar-item" :to="{name:'home'}">
                <img src="@/assets/img/logo.svg"
                     url="@/assets/img/logo.svg"
                     alt="Camptocamp.org" class="logo src">
            </router-link>
            <a role="button" aria-label="menu" aria-expanded="false"
               class="navbar-burger" :class="{ 'is-active': burgerActive }"
               v-on:click="burgerActive=!burgerActive">

                  <span aria-hidden="true"></span>
                  <span aria-hidden="true"></span>
                  <span aria-hidden="true"></span>
            </a>
        </div>

        <div id="navMenu" class="navbar-menu is-size-5" v-bind:class="{ 'is-active': burgerActive }">
            <div class="navbar-start">
                <router-link class="navbar-item" :to="{name:link.name}"
                             v-for="(link, index) in links" :key="index">
                    <component :is="link.iconName" class="is-medium"/>
                    {{link.text}}
                </router-link>

                <div class="navbar-item field">
                    <div class="control has-icons-left">
                        <input class="input is-primary is-size-5" placeholder="Search" v-model="searchText" @input="search()">
                        <span class="icon is-left is-size-5">
                            <fa-icon icon="search"/>
                        </span>
                    </div>
                </div>

            </div>

            <div class="navbar-end">

                <div class="navbar-item" v-if="!user.isLogged()">
                    <router-link class="button is-primary"
                                 :to="{ name: 'auth' }">
                        sign in
                    </router-link>
                </div>

                <div class="navbar-item has-dropdown is-hoverable" v-else>
                    <div  class="navbar-link">
                        <img class="user-avatar" :src="'https://forum.camptocamp.org/user_avatar/forum.camptocamp.org/' + user.data.forum_username + '/36/1_1.png'">
                    </div>
                    <div class="navbar-dropdown is-right is-boxed is-size-5">
                        <router-link class="navbar-item" :to="{ name: 'profile', params:{id:user.data.id} }">
                            <fa-icon icon="user"/>
                            my profile
                        </router-link>
                        <router-link class="navbar-item" :to="{ name: 'account' }">
                            <fa-icon icon="check-circle"/>
                            my account
                        </router-link>
                        <router-link class="navbar-item" :to="{ name: 'preferences' }">
                            <fa-icon icon="cogs"/>
                            my preferences
                        </router-link>

                        <router-link class="navbar-item" :to="{ name: 'outings', query:{u:user.data.id} }">
                            <icon-outing />
                            my outings
                        </router-link>
                        <router-link class="navbar-item" :to="{ name: 'following' }">
                            <fa-icon icon="heart"/>
                            my followed users
                        </router-link>
                        <router-link class="navbar-item" :to="{ name: 'mailinglists' }">
                            <fa-icon icon="at"/>
                            my mailings
                        </router-link>
                        <hr class="navbar-divider">
                        <a class="navbar-item" @click="signout">
                            <fa-icon icon="sign-out-alt"/>
                            sign out
                        </a>
                    </div>
                </div>

                <div class="navbar-item has-dropdown is-hoverable">
                    <a class="navbar-link">
                        {{user.data.lang}}
                    </a>
                    <div class="navbar-dropdown is-right is-boxed is-size-5">
                        <a class="navbar-item" v-for="lang in langs" :key="lang" @click="user.setLang(lang)">
                            {{lang}}
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </nav>
</template>

<script>

    import user from "@/js/user.js"
    import constants from "@/js/constants.js"

    export default {

        data() {
            return {
                user,
                burgerActive:false,
                langs:constants.langs,
                links: [
                    {
                        text: 'Routes',
                        name:'routes',
                        iconName:"icon-route"
                    },
                    {
                        text: 'Outings',
                        name:'outings',
                        iconName:"icon-outing"
                    },
                    {
                        text: 'Forum',
                        name:"forum",
                        iconName:"icon-forum"
                    },
                    {
                        text: 'SERAC',
                        name:'serac',
                        iconName:"icon-xreport"
                    },
                    {
                        text: 'Articles',
                        name:'articles',
                        iconName:"icon-article"
                    }
                ],
                searchText:'',
            }
        },
        methods:{
            search(){

                if(this.searchText.length >=3){
                    this.$router.push({
                        name: 'search',
                        query: {q: this.searchText}
                    })
                }
            },

            signout(){
                user.signout()
            },
        }
    }
</script>

<style scoped lang="scss">

@import '@/assets/sass/variables.scss';

.navbar{
        box-shadow:0 2px 3px rgba($black, 0.1), 0 0 0 1px rgba($black, 0.1);
}
</style>
