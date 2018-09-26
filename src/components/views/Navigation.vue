<template>
    <nav class="navbar is-light">
        <div class="navbar-brand">
            <router-link :to="{name:'home'}" class="navbar-item">
                <img src="@/assets/img/logo.svg"
                     url="@/assets/img/logo.svg"
                     alt="Camptocamp.org" class="logo src">
            </router-link>
            <a :class="{ 'is-active': burgerActive }" role="button" aria-label="menu"
               aria-expanded="false" class="navbar-burger"
               @click="burgerActive=!burgerActive">

                <span aria-hidden="true"/>
                <span aria-hidden="true"/>
                <span aria-hidden="true"/>
            </a>
        </div>

        <div id="navMenu" :class="{ 'is-active': burgerActive }" class="navbar-menu is-size-5">
            <div class="navbar-start">
                <router-link v-for="(link, index) in links" :to="{name:link.name}"
                             :key="index" class="navbar-item">
                    <component :is="link.iconName" class="is-medium"/>
                    {{ link.text.message }}
                </router-link>

                <div class="navbar-item field">
                    <div class="control has-icons-left">
                        <input v-model="searchText" class="input is-primary is-size-5" placeholder="Search" @input="search()">
                        <span class="icon is-left is-size-5">
                            <fa-icon icon="search"/>
                        </span>
                    </div>
                </div>

            </div>

            <div class="navbar-end">

                <div v-if="!user.isLogged()" class="navbar-item">
                    <router-link :to="{ name: 'auth' }"
                                 class="button is-primary">
                        <span v-translate>Login</span>
                    </router-link>
                </div>

                <div v-else class="navbar-item has-dropdown is-hoverable">
                    <div class="navbar-link">
                        <img :src="'https://forum.camptocamp.org/user_avatar/forum.camptocamp.org/' + user.data.forum_username + '/36/1_1.png'" class="user-avatar">
                    </div>
                    <div class="navbar-dropdown is-right is-boxed is-size-5">
                        <router-link :to="{ name: 'profile', params:{id:user.data.id} }" class="navbar-item">
                            <fa-icon icon="user"/>
                            <span v-translate>my profile</span>
                        </router-link>
                        <router-link :to="{ name: 'account' }" class="navbar-item">
                            <fa-icon icon="check-circle"/>
                            <span v-translate>my account</span>
                        </router-link>
                        <router-link :to="{ name: 'preferences' }" class="navbar-item">
                            <fa-icon icon="cogs"/>
                            <span v-translate>my preferences</span>
                        </router-link>

                        <router-link :to="{ name: 'outings', query:{u:user.data.id} }" class="navbar-item">
                            <icon-outing />
                            <span v-translate>my outings</span>
                        </router-link>
                        <router-link :to="{ name: 'following' }" class="navbar-item">
                            <fa-icon icon="heart"/>
                            <span v-translate>my followed users</span>
                        </router-link>
                        <router-link :to="{ name: 'mailinglists' }" class="navbar-item">
                            <fa-icon icon="at"/>
                            <span v-translate>my mailings</span>
                        </router-link>
                        <hr class="navbar-divider">
                        <a class="navbar-item" @click="signout">
                            <fa-icon icon="sign-out-alt"/>
                            <span v-translate>sign out</span>
                        </a>
                    </div>
                </div>
                <div class="navbar-item has-dropdown is-hoverable">
                    <a class="navbar-link">
                        {{ $language.current }}
                    </a>
                    <div class="navbar-dropdown is-right is-boxed is-size-5">
                        <a v-for="(language, key) in $language.available" :key="key" class="navbar-item" @click="setLang(key)">
                            {{ language }}
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
                links: [
                    {
                        text: this.$gettext('Routes'),
                        name:'routes',
                        iconName:"icon-route"
                    },
                    {
                        text: this.$gettext('Outings'),
                        name:'outings',
                        iconName:"icon-outing"
                    },
                    {
                        text: this.$gettext('Forum'),
                        name:"forum",
                        iconName:"icon-forum"
                    },
                    {
                        text: this.$gettext('SERAC'),
                        name:'serac',
                        iconName:"icon-xreport"
                    },
                    {
                        text: this.$gettext('Articles'),
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

            setLang(lang){
                this.$language.current = lang
                user.setLang(lang)
            }
        }
    }
</script>

<style scoped lang="scss">

@import '@/assets/sass/variables.scss';

.navbar{
        box-shadow:0 2px 3px rgba($black, 0.1), 0 0 0 1px rgba($black, 0.1);
}
</style>
