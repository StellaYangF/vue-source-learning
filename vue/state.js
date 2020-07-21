import { observe } from './observer';
import { proxy } from './util';

export function initState(vm) {
    const opts = vm.$options;

    if (opts.props) initProps(vm);
    if (opts.methods) initMethods(vm);
    if (opts.data) initData(vm);
    if (opts.computed) initComputed(vm);
    if (opts.watch) initWatch(vm);
}

function initProps() {}

function initMethods() {}

function initData(vm) {
    let data = vm.$options.data;
    data = vm._data = typeof data === 'function' ? data.call(vm) : data;
    Object.keys(data).forEach(key => proxy(vm, '_data', key));
    observe(data);

}

function initComputed() {}

function initWatch() {}
