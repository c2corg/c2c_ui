<template>
    <aside>
        <router-link :to="{name:'home'}" class="menu-brand">
            <img src="@/assets/img/logo.svg"
                 url="@/assets/img/logo.svg"
                 alt="Camptocamp.org" class="logo src">
        </router-link>
        <router-link :to="{name:'topoguide'}" class="menu-item">
            <fa-icon icon="arrow-right"/>
            <span class="menu-item-text" v-translate>Topoguide</span>
        </router-link>
        <router-link :to="{name:'outings'}" class="menu-item">
            <icon-outing class="is-medium"/>
            <span class="menu-item-text" v-translate>Outings</span>
        </router-link>
        <router-link :to="{name:'forum'}" class="menu-item">
            <icon-forum class="is-medium"/>
            <span class="menu-item-text" v-translate>Forum</span>
        </router-link>
        <router-link :to="{name:'serac'}" class="menu-item">
            <icon-xreport class="is-medium"/>
            <span class="menu-item-text" v-translate>SERAC</span>
        </router-link>
        <router-link :to="{name:'articles'}" class="menu-item">
            <icon-article class="is-medium"/>
            <span class="menu-item-text" v-translate>Articles</span>
        </router-link>
        <div class="menu-footer is-size-7">
            <div class="menu-add">

            </div>

            <div class="has-text-centered">
                <router-link :to="{name:'article', params:{id:106727}}" v-translate>
                    contact
                </router-link>
                <span> &bull; </span>
                <router-link :to="{name:'article', params:{id:106731}}" v-translate>
                    EULA
                </router-link>
                <span> &bull; </span>
                <router-link :to="{name:'article', params:{id:106728}}" v-translate>
                    licenses
                </router-link>
                <br>
                <router-link :to="{name:'article', params:{id:106726}}" v-translate>
                    Association
                </router-link>
            </div>

            <div class="columns is-gapless has-text-centered">
                <div class="column">
                    T
                </div>
                <div class="column">
                    T
                </div>
                <div class="column">
                    T
                </div>
            </div>
        </div>
    </aside>
</template>

<style scoped lang="scss">
    @import '@/assets/sass/variables.scss';

    aside{
        box-shadow: 0 1px 4px 0 rgba(0,0,0,.2);
    }

    .menu-brand{
        height:80px;
        display:block;
        padding:5px;
    }

    .menu-item{
        display: block;
        height: 37px;
        border-top: 1px solid #ccc;
        padding: 8px 15px;
        color:$grey-dark;
    }

    .menu-item:hover{
        background:$primary;
        color:$white;
    }

    .menu-item-text{
        margin-left: 10px
    }

    .menu-footer{
        position: absolute;
        width:100%;
        bottom: 0;

        div {
            margin-bottom: 15px!important;
        }

        .menu-add{
            background:red;
            height: 320px;
            margin-left: calc((200px - 160px)/2);
            margin-right: calc((200px - 160px)/2);
        }
    }
</style>
