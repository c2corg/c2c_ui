<template>
    <nav class="no-print is-size-5">
        <router-link :to="{name:'home'}" class="navigation-brand has-text-centered">
            <img src="@/assets/img/logo_small.svg"
                 url="@/assets/img/logo_small.svg"
                 alt="Camptocamp.org">
        </router-link>

        <div class="navigation-end">
            <input-document
                class="navigation-item search-input"
                :document-type="['waypoint', 'route', 'article', 'book']"
                propose-creation
                @input="go"/>

            <div v-if="!siteConfiguration.urls.readWrite" class="navigation-item is-hidden-mobile" v-tooltip:bottom="'Read only site'">
                <fa-layers >
                    <fa-icon icon="pen"/>
                    <fa-icon icon="ban" transform="grow-16" class="has-text-danger"/>
                </fa-layers>
            </div>

            <div v-if="!siteConfiguration.isProduction" class="navigation-item is-hidden-mobile" v-tooltip:bottom="'This page may contains bugs or incomplete features'">
                <fa-icon icon="bug" size="lg" class="has-text-danger"/>
            </div>

            <div v-if="!siteConfiguration.isProduction" class="navigation-item dropdown is-hoverable is-hidden-mobile">
                <div class="dropdown-trigger">
                    <fa-icon icon="database"/>
                </div>
                <div class="dropdown-menu">
                    <div class="dropdown-content">
                        <a
                            v-for="(urlsConfiguration, i) of Object.values(siteConfiguration.urlsConfigurations)"
                            :key="i"
                            class="dropdown-item is-size-5"
                            :class="{'is-active': urlsConfiguration.name == siteConfiguration.urls.name}"
                            @click="setUrlsConfiguration(urlsConfiguration.name)">
                            <span>{{ urlsConfiguration.name }}</span>
                        </a>
                    </div>
                </div>
            </div>

            <div v-if="!$user.isLogged" class="navigation-item ">
                <login-button class="is-link"/>
            </div>

            <div v-else class="navigation-item dropdown is-hoverable">
                <div class="dropdown-trigger">
                    <img
                        :src="'https://forum.camptocamp.org/user_avatar/forum.camptocamp.org/' + $user.forumUsername + '/24/1_1.png'"
                        class="user-avatar">
                </div>
                <div class="dropdown-menu">
                    <div class="dropdown-content">

                        <router-link :to="{ name: 'profile', params:{id:$user.id} }" class="dropdown-item is-size-5">
                            <fa-icon icon="user"/>
                            <span v-translate>My profile</span>
                        </router-link>
                        <router-link :to="{ name: 'account' }" class="dropdown-item is-size-5">
                            <fa-icon icon="check-circle"/>
                            <span v-translate>My account</span>
                        </router-link>
                        <router-link :to="{ name: 'preferences' }" class="dropdown-item is-size-5">
                            <fa-icon icon="cogs"/>
                            <span v-translate>My preferences</span>
                        </router-link>

                        <router-link :to="{ name: 'outings', query:{u:$user.id} }" class="dropdown-item is-size-5">
                            <icon-outing />
                            <span v-translate>My outings</span>
                        </router-link>
                        <router-link :to="{ name: 'whatsnew', query:{u:$user.id} }" class="dropdown-item is-size-5">
                            <fa-icon icon="edit"/>
                            <span v-translate>My changes</span>
                        </router-link>
                        <router-link :to="{ name: 'following' }" class="dropdown-item is-size-5">
                            <fa-icon icon="heart"/>
                            <span v-translate>My followed users</span>
                        </router-link>
                        <router-link :to="{ name: 'mailinglists' }" class="dropdown-item is-size-5">
                            <fa-icon icon="at"/>
                            <span v-translate>My mailing lists</span>
                        </router-link>
                        <hr class="dropdown-divider">
                        <a class="dropdown-item is-size-5" @click="$user.signout()">
                            <fa-icon icon="sign-out-alt"/>
                            <span v-translate>Logout</span>
                        </a>
                    </div>
                </div>
            </div>
            <div v-if="!$user.isLogged" class="navigation-item dropdown is-hoverable">
                <div class="dropdown-trigger">
                    {{ $language.current }}
                </div>
                <div class="dropdown-menu">
                    <div class="dropdown-content">
                        <a
                            v-for="(language, key) in $language.available"
                            :key="key"
                            class="dropdown-item is-size-5"
                            :class="{'is-active': key==$language.current}"
                            @click="$user.lang = key">
                            {{ language }}
                        </a>
                    </div>
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
        max-width: 100vw;
        height:$navbar-height;
        background-color: $white;
        // border-bottom:1px solid $grey-lighter
        box-shadow: 0 2px 2px rgba($black, 0.1);
        display: flex;

        .navigation-brand{
            img{

                height:$navbar-height;
                padding:5px;
                margin-left:20px;
            }
        }

        .navigation-end{
            justify-content: flex-end;
            margin-left: auto;
            display:flex;
            margin-right: 1rem;

            .user-avatar{
                vertical-align: bottom;
            }

            .dropdown-menu{
                // position:fixed;
                left:auto;
                right:5px;
            }
        }

        .navigation-item{
            display:flex;
            align-items: center;
            line-height: 1.5;
            padding: 0.5rem 0.75rem;
        }
    }

    .search-input{
        width:250px;
        transition: width .5s ease;
    }

    .search-input:hover{
        width:300px;
    }
</style>
