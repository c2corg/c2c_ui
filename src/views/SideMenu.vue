<template>
    <aside>
        <!-- <router-link :to="{name:'home'}" class="menu-brand has-text-centered">
            <img src="@/assets/img/logo.svg"
                 url="@/assets/img/logo.svg"
                 alt="Camptocamp.org">
        </router-link> -->

        <router-link
            v-for="item of menuItems"
            :key="item.name"
            :to="{name:item.name}"
            class="menu-item">
            <component :is="item.icon" />
            <span class="menu-item-text"> {{ item.text }} </span>
        </router-link>

        <div class="menu-footer is-size-7">
            <div class="menu-add">
                .
            </div>

            <div class="has-text-centered menu-links">
                <router-link :to="{name:'article', params:{id:106727}}" v-translate>contact</router-link>
                <span> &bull; </span>
                <router-link :to="{name:'article', params:{id:106731}}" v-translate>EULA</router-link>
                <span> &bull; </span>
                <router-link :to="{name:'article', params:{id:106728}}" v-translate>licenses</router-link>
                <br>
                <router-link :to="{name:'article', params:{id:106726}}" v-translate>Association</router-link>
            </div>

            <div class="columns is-gapless has-text-centered menu-socials">
                <div class="column">
                    <img src="@/assets/img/social/twitter.png" alt="Twitter">
                </div>
                <div class="column">
                    <img src="@/assets/img/social/google-plus.png" alt="Google+">
                </div>
                <div class="column">
                    <img src="@/assets/img/social/facebook.png" alt="Facebook">
                </div>
            </div>
        </div>
    </aside>
</template>

<script>
    export default {
        computed:{
            menuItems(){
                return [
                    {name:'topoguide', icon:'icon-topoguide', text:this.$gettext('Topoguide')},
                    {name:'outings', icon:'icon-outing', text:this.$gettext('Outings')},
                    {name:'forum', icon:'icon-forum', text:this.$gettext('Forum')},
                    {name:'serac', icon:'icon-xreport', text:this.$gettext('SERAC')},
                    {name:'articles', icon:'icon-article', text:this.$gettext('Articles')},
                ]
            }
        }
    }
</script>

<style scoped lang="scss">
    @import '@/assets/sass/variables.scss';

    aside{
        box-shadow: 0 1px 4px 0 rgba(0,0,0,.2);
        background: $white;
    }

    // .menu-brand{
    //     height:80px;
    //     display:block;
    //     padding:5px;
    //
    //     img {
    //         width: 140px;
    //     }
    // }

    .menu-item{
        display: block;
        height: 37px;
        // border-top: 1px solid #ccc;
        padding: 8px 10px;
        border-left:5px solid $white;
        color:$grey-dark;
    }

    .menu-item:hover{
        background:$light;
        // color:$white;
    }

    .menu-item-text{
        margin-left: 10px;
        font-size:1.1rem;
    }

    .menu-item.router-link-active{
        border-left:5px solid $primary;
        font-weight: bold;
    }

    .menu-footer{
        position: absolute;
        width:100%;
        bottom: 0;

        .menu-socials, .menu-add, .menu-links {
            margin-bottom: 15px!important;
        }

        .menu-add{
            background:$grey-lighter;
            height: 320px;
            margin-left: calc((200px - 160px)/2);
            margin-right: calc((200px - 160px)/2);
        }
    }
</style>
