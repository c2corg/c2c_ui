<template>
    <div class="card-content">
        <icon-forum />
        @{{document.forum_username}}
        <div>
            <activities :activities="document.activities"/>
        </div>
    </div>
</template>

<script>

    export default {
        props: ['document'],
    }
    
</script>
