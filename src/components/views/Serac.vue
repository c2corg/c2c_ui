<template>
    <div class="serac-view">
        <div class="serac-view-part">
            <h1 class="title is-1">SERAC</h1>
            <h2 class="subtitle is-1">Accident database</h2>

            <p>
                SERAC is a worldwide incidents and accidents database aiming
                at increasing safety in rock climbing and mountain sports.
            </p>

            <div>

                <router-link to="xreports" class="button is-primary">
                    <i class="fas fa-plus"/>
                    <span translate>Create a new report</span>
                </router-link>

                <router-link to="xreports" class="button is-link">
                    <i class="fas fa-list"/>
                    <span translate>View xreports</span>
                </router-link>

                <router-link :to="{name:'article', params:{id:697210}}"  class="button is-info">
                    <i class="fas fa-info"/>
                    <span translate>Know more about SERAC</span>
                </router-link>
            </div>
        </div>

        <div class="serac-view-part">
            <h2 class="title is-2">
                Xreports
            </h2>
            ...
        </div>

        <div class="serac-view-part">
            <h2 class="title is-2">
                Camptocamp, source de données pour les traveaux de recherche
            </h2>
            ...

            <h2 class="title is-3">
                Travaux de recherche 1
            </h2>
            ...
            <h2 class="title is-3">
                Travaux de recherche 2
            </h2>
            <h2 class="title is-3">
                Travaux de recherche 3
            </h2>
            ...
        </div>

    </div>
</template>

<script>
    export default {
    }
</script>

<style>

.serac-view{
    background-image:url(https://www.camptocamp.org/static/img/home/cermygian-crevasse.jpg);
    text-align: center;
}

.serac-view .serac-view-part{
    margin-bottom:30px;
    padding:15px;
    background-color:rgba(21,50,69,0.2);
}

.serac-view,
.serac-view h1,
.serac-view h2{
    color:white;
}

.serac-view .button{
    margin:10px;
}

</style>