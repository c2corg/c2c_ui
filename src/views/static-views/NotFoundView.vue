<template>
    <section class="section has-text-centered">
        <html-header title="Page not found"/>
        <h1 class="title is-1" v-translate>Ooops</h1>
        <h3 class="subtitle is-3" v-translate>Page not found</h3>

        <p v-translate>The page you are looking for does not exist or is broken.</p>
        <p>{{ $route.fullPath }}</p>

        <p>
            <a href="javascript:history.go(-1)" v-translate>Go to the previous page</a>
            <span v-translate> or try the following pages:</span>
        </p>

        <div class="is-flex">
            <router-link :to="{name:'home'}">
                <fa-icon icon="home"/>
                <div v-translate>Home</div>
            </router-link>

            <router-link to="outings">
                <icon-outing/>
                <div v-translate>outings</div>
            </router-link>

            <router-link to="waypoints">
                <icon-waypoint/>
                <div v-translate>waypoints</div>
            </router-link>

            <router-link to="routes">
                <icon-route/>
                <div v-translate>routes</div>
            </router-link>

            <router-link to="articles">
                <icon-article/>
                <div v-translate>articles</div>
            </router-link>

            <router-link to="books">
                <icon-book/>
                <div v-translate>books</div>
            </router-link>

            <router-link to="xreports">
                <icon-xreport/>
                <div v-translate>xreports</div>
            </router-link>

            <router-link to="images">
                <icon-image/>
                <div v-translate>images</div>
            </router-link>

            <router-link to="areas">
                <icon-area/>
                <div v-translate>areas</div>
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
