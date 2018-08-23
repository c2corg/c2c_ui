<template>
    <span>
        <a href="https://creativecommons.org/licenses/by-sa/3.0/deed.fr" target="_blank"
           v-if="cc == 'by-sa'">
            <i class="fab fa-creative-commons"></i> CC BY-SA 3.0
        </a>
        <a href="https://creativecommons.org/licenses/by-nc-nd/3.0/deed.fr" target="_blank"
           v-if="cc=='by-nc-nd'">
            <i class="fab fa-creative-commons"></i> CC BY-NC-ND 3.0
        </a>
    </span>
</template>

<script>
    export default {
        props: ['document', 'cc'],
    }
</script>
