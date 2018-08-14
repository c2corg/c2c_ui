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
    import Activities from '@/components/utils/Activities'

    export default {
        components:{
            Activities
        },

        props: ['document'],

    }
</script>
