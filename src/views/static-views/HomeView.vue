<template>
    <div>
        <html-header title="Home"/>
        <div class="topoguide">
            <div class="links is-flex">
                <router-link to="outings" class="link">
                    <div><icon-outing /></div>
                    <span v-translate>Outings</span>
                </router-link>

                <router-link to="routes">
                    <div><icon-route /></div>
                    <span v-translate>Routes</span>
                </router-link>

                <router-link to="waypoints">
                    <div><icon-waypoint /></div>
                    <span v-translate>Waypoints</span>
                </router-link>

                <router-link to="images">
                    <div><icon-image /></div>
                    <span v-translate>Images</span>
                </router-link>

                <router-link to="books">
                    <div><icon-book /></div>
                    <span v-translate>Books</span>
                </router-link>

                <router-link to="areas">
                    <div><icon-area /></div>
                    <span v-translate>Areas</span>
                </router-link>
            </div>
        </div>

        <div class="social-network">
            <div class="links is-flex">
                <a>
                    <div><icon-forum/></div>
                    <span v-translate>Forum</span>
                </a>

                <router-link to="dashboard">
                    <div><fa-icon icon="columns"/></div>
                    <span v-translate>Dashboard</span>
                </router-link>

                <router-link to="feed">
                    <div><fa-icon icon="users"/></div>
                    <span v-translate>Social network</span>
                </router-link>

                <a>
                    <div><fa-icon :icon="['fab', 'facebook']"/></div>
                    <span>Facebook</span>
                </a>

                <a>
                    <div><fa-icon :icon="['fab', 'twitter']"/></div>
                    <span>Twitter</span>
                </a>

                <a>
                    <div><fa-icon :icon="['fab', 'google']"/></div>
                    <span>Google</span>
                </a>

            </div>
        </div>
    </div>
</template>

<script>
    export default {
    }
</script>

<style scoped lang="scss">

    .topoguide{
        background-image:url('~@/assets/img/backgrounds/laurentf-sajama.jpg');
    }

    .social-network{
        background-image:url('~@/assets/img/backgrounds/alexsaunier-monch.jpg');
    }

    .topoguide, .social-network{
        background-size:cover;
        padding-top:100px;
        padding-bottom:100px;
        justify-content:center;
    }

    .links{
        justify-content:center;
        flex-flow:wrap row;
        max-width:660px;
        margin:auto;
    }

    .links > a{
        border-radius:50%;
        border:3px solid white;
        width:150px;
        height:150px;
        margin:10px;
        background-color:rgba(128,128,128,0.4);
        color:white;
        font-weight:bold;
        transition: background 0.2s;

        box-sizing:border-box;
        display: flex;
        flex-direction: column;

        justify-content:center;
        text-align:center;
    }

    .links > a > span{
        font-size:150%;
        word-wrap: break-word;
        overflow-wrap: break-word;
    }

    .links > a > div > span > i{
        font-size:200%;
    }

    .links > a:hover{
        background-color:rgba(255,255,255,0.5);
        transition: background 0.2s;
        color:white;
    }

</style>
