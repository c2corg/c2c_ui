<template>
    <nav class="navbar is-light no-print">
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

        <div :class="{ 'is-active': burgerActive }" class="navbar-menu is-size-5">
            <div class="navbar-start">
                <router-link :to="{name:'routes'}" class="navbar-item">
                    <icon-route class="is-medium"/>
                    <span v-translate>Routes</span>
                </router-link>
                <router-link :to="{name:'outings'}" class="navbar-item">
                    <icon-outing class="is-medium"/>
                    <span v-translate>Outings</span>
                </router-link>
                <router-link :to="{name:'forum'}" class="navbar-item">
                    <icon-forum class="is-medium"/>
                    <span v-translate>Forum</span>
                </router-link>
                <router-link :to="{name:'serac'}" class="navbar-item">
                    <icon-xreport class="is-medium"/>
                    <span v-translate>SERAC</span>
                </router-link>
                <router-link :to="{name:'articles'}" class="navbar-item">
                    <icon-article class="is-medium"/>
                    <span v-translate>Articles</span>
                </router-link>

                <div class="navbar-item field">
                    <div class="control has-icons-left">
                        <input
                            v-model="searchText"
                            class="input is-primary is-size-5"
                            :placeholder="$gettext('Search ...')"
                            @input="search()">
                        <span class="icon is-left is-size-5">
                            <fa-icon icon="search"/>
                        </span>
                    </div>
                </div>

            </div>

            <div class="navbar-end">

                <div v-if="!user.isLogged" class="navbar-item">
                    <login-button />
                </div>

                <div v-else class="navbar-item has-dropdown is-hoverable">
                    <div class="navbar-link">
                        <img :src="'https://forum.camptocamp.org/user_avatar/forum.camptocamp.org/' + user.forumUsername + '/36/1_1.png'" class="user-avatar">
                    </div>
                    <div class="navbar-dropdown is-right is-boxed is-size-5">

                        <router-link :to="{ name: 'profile', params:{id:user.id} }" class="navbar-item">
                            <fa-icon icon="user"/>
                            <span v-translate>My profile</span>
                        </router-link>
                        <router-link :to="{ name: 'account' }" class="navbar-item">
                            <fa-icon icon="check-circle"/>
                            <span v-translate>My account</span>
                        </router-link>
                        <router-link :to="{ name: 'preferences' }" class="navbar-item">
                            <fa-icon icon="cogs"/>
                            <span v-translate>My preferences</span>
                        </router-link>

                        <router-link :to="{ name: 'outings', query:{u:user.id} }" class="navbar-item">
                            <icon-outing />
                            <span v-translate>My outings</span>
                        </router-link>
                        <router-link :to="{ name: 'whatsnew', query:{u:user.id} }" class="navbar-item">
                            <fa-icon icon="edit"/>
                            <span v-translate>My changes</span>
                        </router-link>
                        <router-link :to="{ name: 'following' }" class="navbar-item">
                            <fa-icon icon="heart"/>
                            <span v-translate>My followed users</span>
                        </router-link>
                        <router-link :to="{ name: 'mailinglists' }" class="navbar-item">
                            <fa-icon icon="at"/>
                            <span v-translate>My mailing lists</span>
                        </router-link>
                        <hr class="navbar-divider">
                        <a class="navbar-item" @click="signout">
                            <fa-icon icon="sign-out-alt"/>
                            <span v-translate>Logout</span>
                        </a>
                    </div>
                </div>
                <div v-if="!user.isLogged" class="navbar-item has-dropdown is-hoverable">
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
                user, // Keep this here, trick to set it reactive...
                burgerActive:false,
                searchText:'',
            }
        },

        methods: {
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
                this.$language.setCurrent(lang)
                user.lang = lang
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
