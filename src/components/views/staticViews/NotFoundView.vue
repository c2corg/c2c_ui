<template>
    <section class="section has-text-centered">
        <h1 class="title is-1">Ooops</h1>
        <h3 class="subtitle is-3">Page not found</h3>

        <p>The page you are looking for does not exist or is broken.</p>

        <p>{{ $route.fullPath }}</p>

        <p>
            <a href="javascript:history.go(-1)">Go to the previous page</a>
            <span> or try the following pages:</span>
        </p>

        <div class="is-flex">
            <router-link :to="{name:'home'}">
                <fa-icon icon="home"/>
                <div>Home</div>
            </router-link>

            <router-link to="outings">
                <icon-outing/>
                <div>Outings</div>
            </router-link>

            <router-link to="waypoints">
                <icon-waypoint/>
                <div>Waypoints</div>
            </router-link>

            <router-link to="routes">
                <icon-route/>
                <div>Routes</div>
            </router-link>

            <router-link to="articles">
                <icon-article/>
                <div>Articles</div>
            </router-link>

            <router-link to="books">
                <icon-book/>
                <div>Books</div>
            </router-link>

            <router-link to="xreports">
                <icon-xreport/>
                <div>Xreports</div>
            </router-link>

            <router-link to="images">
                <icon-image/>
                <div>Images</div>
            </router-link>

            <router-link to="areas">
                <icon-area/>
                <div>Areas</div>
            </router-link>
        </div>

        <div>
            <img src="@/assets/img/falling.svg">
        </div>
    </section>
</template>

<style scoped lang="scss">

.is-flex{
    display: flex;
    flex-flow : wrap row;
    justify-content: center;
    max-width: 660px;
    margin:auto;
}

.is-flex a{
    width:100px;
    height:100px;
    border:3px solid white;
    border-radius : 50%;
    margin-left:10px;
    margin-right:10px;
    padding-top:15px;
    background: #EEE;
    transition: 0.3s;
}
.is-flex a:hover{
    background:#DDD;
}
</style>
