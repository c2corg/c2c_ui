<template>
    <router-link :to="{name:type + '-diff', params:{id:id, versionFrom:versionFrom || 'prev', versionTo:versionTo || 'next', lang:lang}}">
        <slot>
            diff
        </slot>
    </router-link>
</template>

<script>

    export default{
        props:["type", "versionFrom", "versionTo", "lang", "id"],
    }
</script>
