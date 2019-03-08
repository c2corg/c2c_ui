<template>
  <div class="serac-view">
    <html-header :title="$gettext('Incidents and accidents')" />
    <div class="serac-view-content">
      <div class="columns is-multiline">
        <div class="column is-12">
          <div class="serac-block has-text-centered has-text-light">

            <h1 class="title is-1 has-text-light has-text-weight-bold" v-translate>SERAC</h1>
            <h3 class="subtitle is-3 has-text-light has-text-weight-bold" v-translate>Let's make our feedbacks valuable</h3>

            <p v-translate>
              SERAC is a worldwide incidents and accidents database aiming at increasing safety in rock climbing and mountain sports.
            </p>
          </div>
        </div>

        <div class="column is-4">
          <div class="serac-block has-text-light">
            <h3 class="title is-3 has-text-light" v-translate>Near-accidents are valuable</h3>
            <p>
              <span v-translate>
                Near-accidents = delicate situation not leading to physical injury but could have lead to a much more serious event.
              </span>
              <br>
              <span v-translate>
                These are positive experiences that reveal usefull risk-management skills.
              </span>
            </p>
          </div>
        </div>
        <div class="column is-4">
          <div class="serac-block has-text-light">
            <h3 class="title is-3 has-text-light" v-translate>
              How is my testimony used ? How / why is it useful ?
            </h3>
            <p v-translate>
              Testimonies help to improve our knowledge of accident scenarios through research activities to define new prevention means.
            </p>
          </div>
        </div>
        <div class="column is-4">
          <div class="serac-block has-text-light">
            <h3 class="title is-3 has-text-light" v-translate>Anonimity and confidentiality</h3>
            <p v-translate>
              You can choose to remain anonymous. Personal data are confidential, accessible only to researchers and moderators.
            </p>
          </div>
        </div>

        <div class="column is-4">
          <add-link document-type="xreport" class="button is-primary has-text-weight-bold">
            <fa-icon icon="plus" />
            &nbsp;
            <span v-translate>Create a new report</span>
          </add-link>
        </div>

        <div class="column is-4">
          <router-link to="xreports" class="button is-warning has-text-weight-bold">
            <fa-icon icon="list" />
            &nbsp;
            <span v-translate>View xreports</span>
          </router-link>
        </div>

        <div class="column is-4">
          <router-link :to="{name:'article', params:{id:697210}}" class="button is-success has-text-weight-bold">
            <fa-icon icon="info" />
            &nbsp;
            <span v-translate>Know more about SERAC</span>
          </router-link>
        </div>

        <div class="column is-12">
          <div class="serac-block">
            <h2 class="title is-2 has-text-light has-text-centered">
              {{ $gettext('xreports') | uppercaseFirstLetter }}
            </h2>

            <div class="columns is-multiline is-variable is-mobile">
              <topoguide-view-small-link
                class="column topoguide-view-small-link"
                v-for="activity of $options.activities"
                :key="activity"
                :to="{name:'xreports', query:{act:activity}}">
                <span class="is-size-1"><icon-activity :activity="activity" /></span>
                <span class="has-text-weight-semibold ">
                  {{ $gettext(activity, 'activities') | uppercaseFirstLetter }}
                </span>
              </topoguide-view-small-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import constants from '@/js/constants';

  import TopoguideViewSmallLink from './TopoguideViewSmallLink';

  export default {
    components: {
      TopoguideViewSmallLink
    },

    activities: constants.activities
  };

</script>

<style scoped lang="scss">

.serac-view{
    background-image:url('~@/assets/img/backgrounds/cermygian-crevasse.jpg');
    background-size: cover;
    background-position-y: 50%;
    min-height: 100%;

    .serac-view-content{
        padding:10px;
        padding-top:60px;
        margin:auto;
        max-width: 880px;
    }
}

.serac-block{
    background-color:rgba(21,50,69,0.4);
    padding:20px;
    height: 100%;
    transition: background-color 300ms;
}

.serac-block:hover{
    background-color:rgba(21,50,69,0.6);
}

.button{
    display: inline-block;
    width: 100%;
}

.topoguide-view-small-link{
  min-width: 10rem;
}

</style>
