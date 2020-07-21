import { createElement, createTextNode } from './vdom/create-element';

export function renderMixin(Vue) {
    Vue.prototype._c = function() {
        //  return _c("div",{id:"app"},_v(_s(name)))
        return createElement(...arguments);// tag, data, children
    }
    Vue.prototype._v = function(text) {
        return createTextNode(text);
    }
    Vue.prototype._s = function(val) {
        return val == null ? '': typeof val === 'object' ? JSON.stringify(val): val;
    }
    Vue.prototype._render = function() {
        const vm = this;
        const { render } = vm.$options;
        /*anonymous() {
            with(this) { return _c("div",{id:"app"},_v(_s(name)),_c("p",undefined,_v(_s(age)))
                )
                }
            }
        */
        // 绑定 this 指向 
        // _c : createVnode
        // _v : create text
        // _s : JSON.stringify()
        const vnode = render.call(vm);
        return vnode;
        // {tag: "div", data: {…}, key: undefined, children: Array(2), text: undefined}
        // { tag, data, key, children, text }
    }
}