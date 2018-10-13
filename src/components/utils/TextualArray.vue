<template>
    <span v-if="array">
        <span v-for="(item, i) of array" :key="i">
            <span>{{ $gettext(item) }}</span><span v-if="i!=array.length-1">, </span>
        </span>
    </span>
</template>

<script>
    export default{
        props:{
            array:{
                type:Array,
                default:null,
            }
        }
    }
</script>
