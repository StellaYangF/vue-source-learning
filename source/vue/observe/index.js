import Observer from './observer';

function initState(vm) {
    let opts = vm.$options;

    opts.data && initData(vm);
    opts.computed && initComputed();
    opts.watch && initWatch();
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

function initComputed() {

}

function initWatch() {

}

export {
    initState,
    observe,
}