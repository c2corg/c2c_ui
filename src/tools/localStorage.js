import localStorage from '@/libs/localStorage'

export default function install(Vue){
    Object.defineProperty(Vue.prototype, '$localStorage', {
        get() {
            if(!this.$options.name)
                throw new Error("Please set name property of your componenent")

            // TODO anti pattern : with this, we can't change any component name
            // find another way. Maybe this in created() :
            // this.$localStorage
            return localStorage.getItem(`${this.$options.name}.preferences`)
        }
    })
}
