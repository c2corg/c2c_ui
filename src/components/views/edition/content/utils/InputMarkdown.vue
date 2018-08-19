<template>
    <div class="field" v-if="field.isVisibleFor(document)">
          <div class="control">
              <h2>{{field.label}}</h2>

              <textarea class="textarea" v-model="locale[field.name]"/>
          </div>
    </div>
</template>

<script>

    export default {
        props:["document", "locale", "field"],
    }
</script>
