<template>
    <aside class="no-print">

        <router-link
            v-for="item of menuItems"
            :key="item.name"
            :to="{name:item.name}"
            class="menu-item"
            :class="{'router-link-active':item.activeFor.includes($route.name)}">
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
                <router-link :to="{name:'article', params:{id:106728}}" v-translate>Licenses</router-link>
                <br>
                <router-link :to="{name:'article', params:{id:106726}}" v-translate>Association</router-link>
            </div>

            <div class="columns is-gapless has-text-centered is-mobile menu-socials">
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
                    {name:'topoguide', icon:'icon-topoguide', text:this.$gettext('Topoguide'), activeFor:['routes', 'waypoints', 'route', 'waypoint', 'area', 'areas']},
                    {name:'outings', icon:'icon-outing', text:this.$gettext('Outings'), activeFor:['outing']},
                    {name:'forum', icon:'icon-forum', text:this.$gettext('Forum'), activeFor:[]},
                    {name:'serac', icon:'icon-xreport', text:this.$gettext('Accident database'), activeFor:['xreports', 'xreport', 'xreport-add']},
                    {name:'articles', icon:'icon-article', text:this.$gettext('Articles'), activeFor:['article']},
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
        margin-left: 0;
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

    @media screen and (max-height: 645px){
        .menu-add{
            display:none!important;
        }
    }

    @media screen and (max-height: 340px){
        .menu-socials{
            display:none!important;
        }
    }

</style>
