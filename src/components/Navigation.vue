<template>
    <nav  id="navbar" class="navbar">
        <div class="navbar-brand">
            <router-link class="navbar-item" :to="'/'">
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

        <div id="navMenu" class="navbar-menu" v-bind:class="{ 'is-active': burgerActive }">
            <div class="navbar-start">
                <router-link class="navbar-item" :to="`${link.page}`"
                             v-for="(link, index) in links" :key="index">
                    <i :class="link.iconClass"></i>
                    {{link.text}}
                </router-link>

                <div class="navbar-item field">
                    <div class="control has-icons-left">
                        <input class="input" placeholder="Search" v-model="searchText" @input="search()">
                        <span class="icon is-left">
                            <i class="fas fa-search"/>
                        </span>
                    </div>
                </div>

            </div>

            <div class="navbar-end">
                <div class="navbar-item">
                    <router-link class="button is-primary"
                                 :to="{ name: 'auth' }"
                                 v-if="!user.logged">
                        sign in
                    </router-link>
                </div>
                <div class="navbar-item has-dropdown is-hoverable">
                    <a class="navbar-link">
                        fr
                    </a>
                    <div class="navbar-dropdown is-boxed">
                        <a class="navbar-item"
                           v-for="lang in langs" :key="lang">
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

    export default {

        data() {
            return {
                user,
                burgerActive:false,
                langs:["fr","en","de"],
                links: [
                    {
                        text: 'Routes',
                        page:'/routes',
                        iconClass:"fas fa-route"
                    },
                    {
                        text: 'Outings',
                        page:'/outings',
                        iconClass:"fas fa-edit"
                    },
                    {
                        text: 'Forum',
                        page:'/About',
                        iconClass:"fab fa-discourse"
                    },
                    {
                        text: 'SERAC',
                        page:'/serac',
                        iconClass:"fa fa-flag-checkered"
                    },
                    {
                        text: 'Articles',
                        page:'/articles',
                        iconClass:"fas fa-newspaper"
                    }
                ],
                searchText:'',
                search(){
                    if(this.searchText.length >=3){
                        this.$router.push({
                            name: 'search',
                            query: {q: this.searchText}
                        })
                    }
                }
            }
        }
    }
</script>
