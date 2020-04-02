import { pushTarget, popTarget } from './dep';
import { nextTick } from './nextTick';

let id = 0;

export default class Watcher {
    /**
     * 
     * @param {*} vm 当前组件实例
     * @param {*} exprOrFn 可能是 updateComponent or express 
     * @param {*} cb 用户传入的 callback vm.$watch('msg', cb)
     * @param {*} opts 
     */
    constructor(vm, exprOrFn, cb = () => { }, opts = {}) {
        this.vm = vm;
        this.exprOrFn = exprOrFn;
        if (typeof exprOrFn === 'function') {
            this.getter = exprOrFn;
        }
        this.cb = cb;
        this.deps = [];
        this.depsId = new Set();
        this.opts = opts;
        this.id = id++;

        this.get();
    }

    get() {
        // 渲染 watcher Dep.target = watcher  
        // msg 变化了 需要让这个 watcher 重新执行
        pushTarget(this);
        this.getter && this.getter();
        popTarget();
    }

    addDep(dep) {
        let id = dep.id;
        if (!this.depsId.has(id)) {
            this.depsId.add(id);
            this.deps.push(dep);
            dep.addSub(this);
        }
    }

    update() {
        // this.get();
        queueWatcher(this);
    }

    run() {
        this.get();
    }
}

let has = {};
let queue = [];

function flushQueue() {
    queue.forEach(watcher => watcher.run());
    has = {};
    queue = [];
}

function queueWatcher(watcher) {
    let id = watcher.id;
    if (has[id] == null) {
        has[id] = true;
        queue.push(watcher);

        nextTick(flushQueue);
    }
}

