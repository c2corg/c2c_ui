<template>
    <div class="card-content">
        <div class="content">

            <card-region-item :document="document"/>

            <br>

            <span>{{document.code}}</span>
            -
            <span>{{document.editor}}</span>

        </div>
    </div>
</template>

<script>
    export default {
        props: ['document'],
    }
</script>