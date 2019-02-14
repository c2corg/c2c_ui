<template>
  <div class="box" v-if="source.length !=0 || !hideButtons">
    <h2 class="title is-2">
      <span>{{ $gettext('Associated routes') }}</span>
      <add-link
        v-if="!hideButtons"
        document-type="route"
        :query="query"
        class="button is-small is-rounded is-primary"/>

      <router-link
        v-if="!hideButtons"
        :to="{name:'routes', query:query}"
        class="button is-small is-rounded is-primary"
        v-translate>
        show all
      </router-link>
    </h2>
    <div v-if="disableActivitySplit">
      <div v-for="route of source" :key="route.document_id">
        <pretty-route-link :route="route" hide-area/>
      </div>
    </div>
    <div v-else v-for="activity of Object.keys(routes)" :key="activity">
      <h3 class="title is-3">
        <icon-activity :activity="activity" />
        {{ $gettext(activity, 'activities') | uppercaseFirstLetter }}
      </h3>
      <div v-for="(route, i) of Object.values(routes[activity])" :key="i">
        <pretty-route-link :route="route" hide-activities hide-area/>
      </div>
    </div>

  </div>
</template>

<script>
  import { requireDocumentProperty } from '@/js/properties-mixins';

  export default {
    mixins: [ requireDocumentProperty ],

    props: {
      hideButtons: {
        type: Boolean,
        default: false
      },

      disableActivitySplit: {
        type: Boolean,
        default: false
      }
    },

    computed: {
      query() {
        const query = {};
        query[this.document.type] = this.document.document_id;
        return query;
      },

      source() {
        return this.document.associations.routes || this.document.associations.all_routes.documents;
      },

      routes() {
        const result = {};

        for (const route of this.source) {
          for (const activity of route.activities) {
            if (!result[activity]) {
              result[activity] = {};
            }

            result[activity][route.document_id] = route;
          }
        }

        return result;
      }
    }
  };
</script>

<style scoped>
    h3{
        margin-top:1.5rem!important;
        margin-bottom: 0.5rem!important;
    }

    .button{
        vertical-align: bottom;
        margin-left: 1rem;
    }
</style>
