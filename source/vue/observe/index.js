import Observer from './observer';
import Watcher from './watcher';
import Dep from './dep';

function initState(vm) {
    let opts = vm.$options;

    opts.data && initData(vm);
    opts.computed && initComputed(vm, opts.computed);
    opts.watch && initWatch(vm);
}

function observe(data) {
    if (typeof data !== 'object' || data == null) return;
    if (data.__ob__) return data.__ob__;
    return new Observer(data);
}

function proxy(vm, source, key) {
    Object.defineProperty(vm, key, {
        get() {
            return vm[source][key];
        },
        set(newValue) {
            vm[source][key] = newValue;
        },
    })

}

function initData(vm) {
    let data = vm.$options.data; 
    data = vm._data = typeof data === 'function' ? data.call(vm) : data || {};
    // proxy vm.key => vm._data.key
    Object.keys(data).forEach(key => proxy(vm, "_data", key));
    // observe
    observe(data);
}

function createComputedGetter(vm, key) {
    let watcher = vm._watchersComputed[key];
    return function() {
        if (watcher) {
            if (watcher.dirty) {
                watcher.evaluate();
            }
            if (Dep.target) {
                watcher.depend();
            }
            return watcher.value;
        }
    }
}

function initComputed(vm, computed) {
    let watchers = vm._watchersComputed = Object.create(null);
    Object.keys(computed).forEach(key => {
        let userDef = computed[key];
        watchers[key] = new Watcher(vm, userDef, () =>{}, {lazy: true });
        Object.defineProperty(vm, key, {
            get: createComputedGetter(vm, key)
        })
    })
}

function initWatch(vm) {
    let watch = vm.$options.watch;
    Object.keys(watch).forEach(key => {
        let userDef = watch[key];
        let handler = userDef;
        if (userDef.handler) {
            handler = userDef.handler;
        }
        createWatcher(vm, key, handler, { immediate: userDef.immediate })
    })
}

function createWatcher(vm, key, handler, opts){
    return vm.$watch(key, handler, opts);
}

export {
    initState,
    observe,
}