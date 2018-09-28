<template>
    <div class="serac-view">
        <html-header title="incidents and accidents"/>
        <div class="serac-view-part">

            <h1 class="title is-1" v-translate>SERAC</h1>
            <h3 class="subtitle is-3" v-translate>Accident database</h3>

            <p v-translate>
                SERAC is a worldwide incidents and accidents database aiming at increasing safety in rock climbing and mountain sports.
            </p>

            <div>

                <add-link type="xreport" class="button is-primary">
                    <fa-icon icon="plus"/>
                    <span v-translate>Create a new report</span>
                </add-link>

                <router-link to="xreports" class="button is-link">
                    <fa-icon icon="list"/>
                    <span v-translate>View xreports</span>
                </router-link>

                <router-link :to="{name:'article', params:{id:697210}}" class="button is-info">
                    <fa-icon icon="info"/>
                    <span v-translate>Know more about SERAC</span>
                </router-link>
            </div>
        </div>

        <div class="serac-view-part">
            <h2 class="title is-2">
                Camptocamp, source de données pour les traveaux de recherche
            </h2>

            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus.

            <h3 class="title is-3">
                Travaux de recherche 1
            </h3>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat. Duis semper. Duis arcu massa, scelerisque vitae, consequat in, pretium a, enim. Pellentesque congue. Ut in risus volutpat libero pharetra tempor. Cras vestibulum bibendum augue. Praesent egestas leo in pede. Praesent blandit odio eu enim. Pellentesque sed dui ut augue blandit sodales. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Aliquam nibh. Mauris ac mauris sed pede pellentesque fermentum. Maecenas adipiscing ante non diam sodales hendrerit.

            <h3 class="title is-3">
                Travaux de recherche 2
            </h3>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat. Duis semper. Duis arcu massa, scelerisque vitae, consequat in, pretium a, enim. Pellentesque congue. Ut in risus volutpat libero pharetra tempor. Cras vestibulum bibendum augue. Praesent egestas leo in pede. Praesent blandit odio eu enim. Pellentesque sed dui ut augue blandit sodales. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Aliquam nibh. Mauris ac mauris sed pede pellentesque fermentum. Maecenas adipiscing ante non diam sodales hendrerit.

            <h3 class="title is-3">
                Travaux de recherche 3
            </h3>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi. Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat. Duis semper. Duis arcu massa, scelerisque vitae, consequat in, pretium a, enim. Pellentesque congue. Ut in risus volutpat libero pharetra tempor. Cras vestibulum bibendum augue. Praesent egestas leo in pede. Praesent blandit odio eu enim. Pellentesque sed dui ut augue blandit sodales. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Aliquam nibh. Mauris ac mauris sed pede pellentesque fermentum. Maecenas adipiscing ante non diam sodales hendrerit.
        </div>

    </div>
</template>

<script>
    export default {
        methods:{

            setLang(lang){
                this.$language.setCurrent(lang)
        //        user.setLang(lang)
            }
        }
    }
</script>

<style scoped>

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
.serac-view h2,
.serac-view h3{
    color:white;
}

.serac-view .button{
    margin:10px;
}

</style>
