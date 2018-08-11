<template>
    <div>
        <div class="topoguide">
            <div class="links is-flex">
                <router-link to="outings" class="link">
                    <div><icon-document type="outing"/></div>
                    <span>Outings</span>
                </router-link>

                <router-link to="routes">
                    <div><icon-document type="route"/></div>
                    <span>Routes</span>
                </router-link>

                <router-link to="waypoints">
                    <div><icon-document type="waypoint"/></div>
                    <span>Waypoints</span>
                </router-link>

                <router-link to="images">
                    <div><icon-document type="image"/></div>
                    <span>Images</span>
                </router-link>

                <router-link to="books">
                    <div><icon-document type="book"/></div>
                    <span>Books</span>
                </router-link>

                <router-link to="areas">
                    <div><icon-document type="area"/></div>
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
                    <div><base-icon iconClass="fas fa-columns"/></div>
                    <span>Dashboard</span>
                </router-link>

                <router-link to="feed">
                    <div><base-icon iconClass="fas fa-users"/></div>
                    <span>Social network</span>
                </router-link>

                <a>
                    <div><base-icon iconClass="fab fa-facebook"/></div>
                    <span>Facebook</span>
                </a>

                <a>
                    <div><base-icon iconClass="fab fa-twitter"/></div>
                    <span>Twitter</span>>
                </a>

                <a>
                    <div><base-icon iconClass="fab fa-google"/></div>
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

<style>


    .topoguide{
        background-image:url(https://www.camptocamp.org/static/img/home/laurentf-sajama.jpg);
    }

    .social-network{
      //  background-image:url(https://www.camptocamp.org/static/img/home/alexsaunier-monch.jpg);
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
