import { pushTarget, popTarget } from './dep';
import { nextTick } from './nextTick';
import { util } from '../utils';

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
        } else {
            this.getter = function() {
                return util.getValue(vm, exprOrFn);
            }
        }
        if (opts.user) {
            this.user = true;
        }
        this.lazy = opts.lazy;
        this.dirty = this.lazy;
        this.cb = cb;
        this.deps = [];
        this.depsId = new Set();
        this.opts = opts;
        this.id = id++;
        this.immediate = opts.immediate;
        this.value = this.lazy ? undefined : this.get();
        this.get();
    }

    evaluate() {
        this.value = this.get();
        this.dirty = false;
    }

    get() {
        // 渲染 watcher Dep.target = watcher  
        // msg 变化了 需要让这个 watcher 重新执行
        pushTarget(this);
        let value = this.getter && this.getter.call(this.vm);
        popTarget();
        return value;
    }

    addDep(dep) {
        let id = dep.id;
        if (!this.depsId.has(id)) {
            this.depsId.add(id);
            this.deps.push(dep);
            dep.addSub(this);
        }
    }

    depend() {
        let i = this.deps.length;
        while(i--) {
            this.deps[i].depend();
        }
    }

    update() {
        // this.get();
        if (this.lazy) {
            this.dirty = true;
        } else {
            queueWatcher(this);
        }
    }

    run() {
        let value = this.get();
        if (this.value !== undefined) {
            this.cb(value, this.value);
        }
        // this.get();
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

