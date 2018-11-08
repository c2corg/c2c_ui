<template>
    <nav class="navbar no-print is-size-5">
        <router-link :to="{name:'home'}" class="navbar-brand has-text-centered">
            <img src="@/assets/img/logo_small.svg"
                 url="@/assets/img/logo_small.svg"
                 alt="Camptocamp.org">
        </router-link>
        <div class="navbar-end">

            <input-document
                class="navbar-item search-input"
                :document-type="['waypoint', 'route', 'article', 'book']"
                propose-creation
                @input="go"/>

            <div v-if="!siteConfiguration.urls.readWrite" class="navbar-item" v-tooltip:bottom="'Read only site'">
                <fa-layers >
                    <fa-icon icon="pen"/>
                    <fa-icon icon="ban" transform="grow-16" class="has-text-danger"/>
                </fa-layers>
            </div>

            <div v-if="!siteConfiguration.isProduction" class="navbar-item" v-tooltip:bottom="'This page may contains bugs or incomplete features'">
                <fa-icon icon="bug" size="lg" class="has-text-danger"/>
            </div>

            <div v-if="!siteConfiguration.isProduction" class="navbar-item has-dropdown is-hoverable">
                <div class="navbar-link">
                    <fa-icon icon="database"/>
                </div>
                <div class="navbar-dropdown is-right is-boxed is-size-5">
                    <a
                        v-for="(urlsConfiguration, i) of Object.values(siteConfiguration.urlsConfigurations)"
                        :key="i"
                        class="navbar-item"
                        :class="{'is-active': urlsConfiguration.name == siteConfiguration.urls.name}"
                        @click="setUrlsConfiguration(urlsConfiguration.name)">
                        <span>{{ urlsConfiguration.name }}</span>
                    </a>
                </div>
            </div>

            <div v-if="!$user.isLogged" class="navbar-item">
                <login-button class="is-link"/>
            </div>

            <div v-else class="navbar-item has-dropdown is-hoverable">
                <div class="navbar-link">
                    <img :src="'https://forum.camptocamp.org/user_avatar/forum.camptocamp.org/' + $user.forumUsername + '/36/1_1.png'" class="user-avatar">
                </div>
                <div class="navbar-dropdown is-right is-boxed is-size-5">

                    <router-link :to="{ name: 'profile', params:{id:$user.id} }" class="navbar-item">
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

                    <router-link :to="{ name: 'outings', query:{u:$user.id} }" class="navbar-item">
                        <icon-outing />
                        <span v-translate>My outings</span>
                    </router-link>
                    <router-link :to="{ name: 'whatsnew', query:{u:$user.id} }" class="navbar-item">
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
                    <a class="navbar-item" @click="$user.signout()">
                        <fa-icon icon="sign-out-alt"/>
                        <span v-translate>Logout</span>
                    </a>
                </div>
            </div>
            <div v-if="!$user.isLogged" class="navbar-item has-dropdown is-hoverable">
                <a class="navbar-link">
                    {{ $language.current }}
                </a>
                <div class="navbar-dropdown is-right is-boxed is-size-5">
                    <a
                        v-for="(language, key) in $language.available"
                        :key="key"
                        class="navbar-item"
                        @click="$user.lang = key">
                        {{ language }}
                    </a>
                </div>
            </div>
        </div>
    </nav>
</template>

<script>
    import config from "@/js/config"

    export default {

        data() {
            return {
                searchText:'',
            }
        },

        computed: {
            siteConfiguration(){
                return config
            }
        },

        methods: {

            go(document){
                this.$router.push({
                    name: this.$documentUtils.getDocumentType(document.type),
                    params: { id: document.document_id }
                })
            },

            setUrlsConfiguration(name){
                config.setUrlsName(name)
                this.$router.go()
            }
        }
    }
</script>

<style scoped lang="scss">
    @import '@/assets/sass/variables.scss';
    nav{
        height:$navbar-height;
        // border-bottom:1px solid $grey-lighter
        box-shadow: 0 2px 2px rgba($black, 0.1);

        .navbar-brand img{

                height:$navbar-height;
                padding:5px;
                margin-left:20px;
        }

    }

    .search-input{
        width:200px;
        transition: width .5s ease;
    }

    .search-input:hover{
        width:300px;
    }
</style>
