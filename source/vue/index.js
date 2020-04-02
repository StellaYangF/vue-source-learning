import  { initState } from './observe';
import Watcher from './observe/watcher';
import { compiler } from './utils';

function Vue(options) {
    this._init(options);
}

Vue.prototype._init = function(options) {
    let vm = this;
    vm.$options = options;

    initState(vm);

    vm.$options.el && vm.$mount();
}

Vue.prototype.$mount = function() {
    let vm = this;
    let el = vm.$options.el;
    el = vm.$el = query(el);
    let updateComponent = () => vm._update();
    new Watcher(vm, updateComponent);
}

Vue.prototype._update = function() { 
    let vm = this;
    let el = vm.$el;

    let node = document.createDocumentFragment();
    let firstChild;
    while(firstChild = el.firstChild) {
        node.appendChild(firstChild);
    }
    // compiler
    compiler(node, vm);
    el.appendChild(node);
}

function query(el) {
    if (typeof el === 'string') {
        return document.querySelector(el);
    }
    return el;
}

export default Vue;