<template>
    <span>
        <span v-for="(item, i) of array" :key="i">
            <span v-translate>{{ item }}</span><span v-if="i!=array.length-1">, </span>
        </span>
    </span>
</template>

<script>
    export default{
        props:{
            array:{
                type:Array,
                required:true,
            }
        }
    }
</script>
