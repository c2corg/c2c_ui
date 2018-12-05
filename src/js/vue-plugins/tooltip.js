// tooltip directive

export default function install(Vue) {
    Vue.directive('tooltip', function(el, binding) {
        if (binding.value !== null && binding.value !== undefined && binding.value !== '') {
            el.classList.add('tooltip')
            el.setAttribute('data-tooltip', binding.value)

            if (binding.arg) {
                el.classList.add('is-tooltip-' + binding.arg)
            }
        }
    })
}
