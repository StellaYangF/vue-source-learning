import { mergeOptions, nextTick } from './util';
import { callHook, mountComponent } from './lifecycle';
import { initState } from './state';
import { compileToFunction } from './compiler';

export function initMixin(Vue) {
    Vue.prototype._init = _init;

    Vue.prototype.$mount = $mount;

    Vue.prototype.$nextTick = nextTick;
}

function _init(options) {
    const vm = this;

    vm.$options = options || mergeOptions(vm.constructor.options, options);

    // 已初始化 Events 和 Lifecycle 生命周期
    callHook(vm, 'beforeCreate');

    initState(vm);

    // 已初始化好 injections注入 和 reactivity 响应式数据
    callHook(vm, 'created');

    if (vm.$options.el) {
        this.$mount(vm.$options.el);
    }
}

function $mount(el) {
    const vm = this;
    const options = vm.$options;
    el = document.querySelector(el);

    if (!options.render) {
        let template = options.template;
        if (!template) {
            template = el.outerHTML;
        }
        const render = compileToFunction(template);
        // console.log(render);
        // _c("div",{id:app},_c("p",undefined,_v('hello' + _s(name) )),_v('hello'))
        options.render = render;
    }

    mountComponent(vm, el);
}