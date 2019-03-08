<template>
  <component :is="to ? 'router-link' : 'div'" :to="to" @click="$emit('click')" class="toolbox-button">
    <span class="toolbox-button-icon">
      <slot name="icon">
        <fa-icon :icon="icon" />
      </slot>
    </span>
    <span>
      {{ label | uppercaseFirstLetter }}
    </span>
  </component>
</template>

<script>
  export default{
    props: {
      icon: {
        type: [String, Array],
        required: true
      },
      label: {
        type: String,
        required: true
      },
      to: {
        type: Object,
        default: null
      }
    }
  };
</script>

<style scoped lang="scss">

  @import "@/assets/sass/variables.scss";

  .toolbox-button{
    display:block;
    cursor:pointer;

    span{
      color:$link;
    }

    :hover{
      color:$text;
    }

    .toolbox-button-icon{
      width: 1rem;
      color:$text;
    }
  }
</style>
