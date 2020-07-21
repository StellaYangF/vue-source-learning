import Watcher from './observer/watcher';
import { patch } from './vdom/patch';

export function callHook(vm, hook) {
    const handlers = vm.$options[hook];
    if (handlers) {
        handlers.forEach(cb => cb.call(vm));
    }
}

export function mountComponent(vm, el) {
    const options = vm.$options;
    vm.$el = el; // 真实 DOM 元素

    // 渲染
    const updateComponent = () => {
        vm._update(vm._render()); // VNode
    }
    
    // 这里的回调 () => {} 是指 watch: 定义的监听函数
    new Watcher(vm, updateComponent, () => {}, true)
}

export function lifecycleMixin(Vue) {
    Vue.prototype._update = function(vnode) {
        const vm = this;
        vm.$el = patch(vm.$el, vnode);
        console.log(vnode);
    }
}