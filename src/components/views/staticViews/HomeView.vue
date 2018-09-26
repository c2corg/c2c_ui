<template>
    <div>
        <html-header title="Home"/>
        <div class="topoguide">
            <div class="links is-flex">
                <router-link to="outings" class="link">
                    <div><icon-outing /></div>
                    <span>Outings</span>
                </router-link>

                <router-link to="routes">
                    <div><icon-route /></div>
                    <span>Routes</span>
                </router-link>

                <router-link to="waypoints">
                    <div><icon-waypoint /></div>
                    <span>Waypoints</span>
                </router-link>

                <router-link to="images">
                    <div><icon-image /></div>
                    <span>Images</span>
                </router-link>

                <router-link to="books">
                    <div><icon-book /></div>
                    <span>Books</span>
                </router-link>

                <router-link to="areas">
                    <div><icon-area /></div>
                    <span>Areas</span>
                </router-link>
            </div>
        </div>

        <div class="social-network">
            <div class="links is-flex">
                <a>
                    <div><icon-forum/></div>
                    <span>Forum</span>
                </a>

                <router-link to="dashboard">
                    <div><fa-icon icon="columns"/></div>
                    <span>Dashboard</span>
                </router-link>

                <router-link to="feed">
                    <div><fa-icon icon="users"/></div>
                    <span>Social network</span>
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

<style scoped>


    .topoguide{
        background-image:url(https://www.camptocamp.org/static/img/home/laurentf-sajama.jpg);
    }

    .social-network{
        background-image:url(https://www.camptocamp.org/static/img/home/alexsaunier-monch.jpg);
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
