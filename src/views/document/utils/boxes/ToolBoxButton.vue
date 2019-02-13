<template>
  <div @click="$emit('click')" class="toolbox-button">
    <fa-icon :icon="icon" class="toolbox-button-icon"/>
    <span>
      {{ label }}
    </span>
  </div>
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
      }
    }
  };
</script>

<style scoped lang="scss">

@import "@/assets/sass/variables.scss";

.toolbox-button{
    cursor:pointer;

    span{
        color:$link;
    }

    :hover{
        color:$text;
    }

    .toolbox-button-icon{
        width: 1rem;
    }

}
</style>
