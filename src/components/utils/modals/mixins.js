
export default {
    data(){
        return {
            visible: false
        }
    },

    methods:{
        show(){
            this.visible = true
            this.$emit("show")
        },

        hide(event){
            event.stopPropagation()
            this.visible = false
            this.$emit("hide")
        }
    }
}
