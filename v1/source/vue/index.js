import { initState } from './observe';
import Watcher from './observe/watcher';
// import { compiler } from './utils';
import { h, patch, render } from './vdom';

function Vue(options) {
    this._init(options);
}

Vue.prototype._init = function (options) {
    let vm = this;
    vm.$options = options;

    initState(vm);

    vm.$options.el && vm.$mount();
}

Vue.prototype.$mount = function () {
    let vm = this;
    let el = vm.$options.el;
    el = vm.$el = query(el);

    let updateComponent = () => {
        vm._update(vm._render());
    };
    new Watcher(vm, updateComponent);
}

Vue.prototype.$watch = function (expr, handler, opts) {
    let vm = this;
    new Watcher(vm, expr, handler, { user: true, ...opts });
}   

Vue.prototype._update = function (vnode) {
    let vm = this;
    let el = vm.$el;
    let preVnode = vm.preVnode;
    if (!preVnode) {
        vm.preVnode = vnode;
        render(vnode, el);
    } else {
        vm.$el = patch(preVnode, vnode);
    }

    // let node = document.createDocumentFragment();
    // let firstChild;
    // while (firstChild = el.firstChild) {
    //     node.appendChild(firstChild);
    // }
    // // compiler
    // compiler(node, vm);
    // el.appendChild(node);
}

Vue.prototype._render = function(){
    let  vm = this;
    let render = vm.$options.render;
    let vnode = render.call(vm, h);
    return vnode;
}

function query(el) {
    if (typeof el === 'string') {
        return document.querySelector(el);
    }
    return el;
}

export default Vue;