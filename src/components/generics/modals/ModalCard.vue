<template>
    <div class="modal" :class="{'is-active': visible}">
        <div class="modal-background" @click="hide" />
        <div class="modal-card">
            <header class="modal-card-head">
                <p class="modal-card-title">
                    <slot name="title">Modal title</slot>
                </p>
                <button class="delete" aria-label="close" @click="hide" />
            </header>
            <section class="modal-card-body">
                <slot>
                    Modal content
                </slot>
            </section>
            <footer class="modal-card-foot">
                <slot name="footer">footer</slot>
            </footer>
        </div>
    </div>
</template>

<script>
    import mixins from './mixins'

    export default {
        mixins: [ mixins ]
    }

</script>
