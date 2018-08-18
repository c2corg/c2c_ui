<template>
    <div class="field" v-if="hasField(document, field)">
          <div class="control">
              <h2>{{field.label}}</h2>

              <textarea class="textarea" v-model="locale[field.name]"/>
          </div>
    </div>
</template>

<script>
    import constants from "@/js/constants.js"

    export default {
        props:["document", "locale", "field"],
        methods:{hasField:constants.hasField}
    }
</script>
