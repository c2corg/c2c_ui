<template>
    <div>
        <div class="topoguide">
            <div class="links is-flex">
                <router-link to="outings" class="link">
                    <i class="fas fa-edit"></i>
                    <span>Outings</span>
                </router-link>

                <router-link to="routes">
                    <i class="fa fa-route"/>
                    <span>Routes</span>
                </router-link>

                <router-link to="waypoints">
                    <i class="fas fa-map-pin"/>
                    <span>Waypoints</span>
                </router-link>

                <router-link to="images">
                    <i class="fas fa-images"/>
                    <span>Images</span>
                </router-link>

                <router-link to="books">
                    <i class="fas fa-atlas"/>
                    <span>Books</span>
                </router-link>

                <router-link to="areas">
                    <i class="fas fa-globe-americas"/>
                    <span>Areas</span>
                </router-link>
            </div>
        </div>

        <div class="social-network">
            <div class="links is-flex">
                <a>
                    <i class="fab fa-discourse"/>
                    <span>Forum</span>
                </a>

                <router-link to="dashboard">
                    <i class="fas fa-columns"/>
                    <span>Dashboard</span>
                </router-link>

                <router-link to="feed">
                    <i class="fas fa-users"/>
                    <span>Social network</span>
                </router-link>

                <a>
                    <i class="fab fa-facebook"/>
                    <span>Facebook</span>
                </a>

                <a>
                    <i class="fab fa-twitter"/>
                    <span>Twitter</span>>
                </a>

                <a>
                    <i class="fab fa-google"/>
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

    .links > a > i{
        font-size:250%;
    }

    .links > a:hover{
        background-color:rgba(255,255,255,0.5);
        transition: background 0.2s;
        color:white;
    }

</style>