<template>
    <div class="serac-view">
        <html-header title="incidents and accidents"/>
        <div class="serac-view-part">

            <h1 class="title is-1" v-translate>SERAC</h1>
            <h3 class="subtitle is-3" v-translate>Accident database</h3>

            <p v-translate>
                SERAC is a worldwide incidents and accidents database aiming at increasing safety in rock climbing and mountain sports.
            </p>

            <div class="buttons is-centered">

                <add-link document-type="xreport" class="button is-primary">
                    <fa-icon icon="plus"/>
                    &nbsp;
                    <span v-translate>Create a new report</span>
                </add-link>

                <router-link to="xreports" class="button is-link">
                    <fa-icon icon="list"/>
                    &nbsp;
                    <span v-translate>View xreports</span>
                </router-link>

                <router-link :to="{name:'article', params:{id:697210}}" class="button is-info">
                    <fa-icon icon="info"/>
                    &nbsp;
                    <span v-translate>Know more about SERAC</span>
                </router-link>
            </div>
        </div>

        <div class="serac-view-part">
            <h2 class="title is-2">
                {{ $gettext('xreports') | uppercaseFirstLetter }}
            </h2>

            <div class="columns is-multiline is-variable is-mobile">
                <topoguide-view-small-link
                    class="column topoguide-view-small-link"
                    v-for="activity of $options.activities"
                    :key="activity"
                    :to="{name:'xreports', query:{act:activity}}">
                    <span class="is-size-2"><icon-activity :activity="activity" /></span>
                    <span class="has-text-weight-semibold has-text-black">
                        {{ $gettext(activity, 'activities') | uppercaseFirstLetter }}
                    </span>
                </topoguide-view-small-link>
            </div>
        </div>

    </div>
</template>

<script>
    import constants from '@/js/constants'

    import TopoguideViewSmallLink from './TopoguideViewSmallLink'

    export default {
        components: {
            TopoguideViewSmallLink
        },

        activities: constants.activities
    }

</script>

<style scoped lang="scss">

.serac-view{
    background-image:url('~@/assets/img/backgrounds/cermygian-crevasse.jpg');
    background-size: cover;
    background-position-y: 50%;
    text-align: center;
    min-height: calc(100vh - 3.5rem);
    padding:30px;
    padding-top:60px;
}

.serac-view-part{
    margin:auto;
    max-width: 880px;
    margin-bottom:30px;
    padding:30px;
    background-color:rgba(21,50,69,0.4);

    .buttons {
        margin-top: 2rem;
    }
}

.serac-view,
.serac-view h1,
.serac-view h2,
.serac-view h3{
    color:white;
}

</style>
